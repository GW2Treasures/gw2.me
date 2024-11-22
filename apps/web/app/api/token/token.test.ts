/** @jest-environment node */
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { assertPKCECodeChallenge, assertRequestAuthentication, handleTokenRequest } from './token';
import { dbMock } from '@/lib/db.mock';
import { Account, Authorization, Client, ClientSecret, ClientType } from '@gw2me/database';
import { expiresAt } from '@/lib/date';
import { Scope } from '@gw2me/client';
import { describe, expect, it } from '@jest/globals';
import { generateClientSecretAndHash } from '@/lib/token';

type MockAuthorization = Authorization & { accounts: Pick<Account, 'id'>[] };

const mockAuthorization: MockAuthorization = {
  id: 'id',
  clientId: 'client-id',
  codeChallenge: null,
  expiresAt: expiresAt(60),
  redirectUri: '/redirect',
  createdAt: new Date(),
  scope: [Scope.Identify],
  token: 'token',
  type: 'Code',
  updatedAt: new Date(),
  usedAt: new Date(),
  userId: 'user-id',
  emailId: null,
  accounts: [],
};

const client: Client & { secrets: ClientSecret[] } = {
  id: 'test',
  applicationId: 'app-id',
  callbackUrls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  type: 'Public',
  secrets: [],
};

const headers = new Headers();

describe('/api/token', () => {
  beforeEach(() => {
    dbMock.client.findUnique.mockResolvedValue(client);
  });

  describe('errors', () => {
    it('Missing client_id', () => expect(handleTokenRequest(headers, { grant_type: 'authorization_code' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing client_id'));

    it('Missing grant_type', () => expect(handleTokenRequest(headers, { client_id: 'test' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));
    it('Invalid grant_type', () => expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'foo' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));

    describe('authorization_code', () => {
      it('Missing code', () => expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing code'));
      it('Missing redirect_uri', () => expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code', code: 'foo' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing redirect_uri'));

      it('Wrong code', async () => {
        dbMock.authorization.findUnique.mockResolvedValue(null);
        await expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'Invalid code');
      });

      it('Expired code', async () => {
        dbMock.authorization.findUnique.mockResolvedValue({ ...mockAuthorization, expiresAt: new Date(0) });
        await expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'code expired');
      });

      it('Invalid redirect_uri', async () => {
        dbMock.authorization.findUnique.mockResolvedValue(mockAuthorization);
        await expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/wrong' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'Invalid redirect_url');
      });

      it('Requires code_verifier', async () => {
        dbMock.authorization.findUnique.mockResolvedValue({ ...mockAuthorization, codeChallenge: 'challenge' });
        await expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'code_verifier missing');
      });

      it('Missing client secret', async () => {
        dbMock.client.findUnique.mockResolvedValue({ ...client, type: 'Confidential', secrets: [{ secret: 'secret' }] } as Client);
        await expect(handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing authorization for confidential client');
      });

      // TODO: add test for wrong secret
    });

    describe('refresh_token', () => {
      // TODO: add refresh token tests
    });
  });

  describe('authorization_code', () => {
    it('returns token', async () => {
      dbMock.authorization.findUnique.mockResolvedValue(mockAuthorization);
      dbMock.authorization.upsert.mockResolvedValue({ token: 'token' } as MockAuthorization);

      const response = await handleTokenRequest(headers, { client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect', client_secret: undefined });
      expect(response).toHaveProperty('access_token');
    });
  });

  describe('PKCE challenge', () => {
    it('no challenge', () => expect(() => assertPKCECodeChallenge(null, undefined)).not.toThrow());
    it('missing verifier', () => expect(() => assertPKCECodeChallenge('S256:challenge', undefined)).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'code_verifier missing'));
    it('unknown method', () => expect(() => assertPKCECodeChallenge('foo:challenge', 'bar')).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Unsupported code challenge'));
    it('wrong verifier', () => expect(() => assertPKCECodeChallenge('S256:challenge', 'wrong')).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'code challenge verification failed'));
    it('success', () => expect(() => assertPKCECodeChallenge('S256:w6uP8Tcg6K2QR905Rms8iXTlksL6OD1KOWBxTK7wxPI', 'foobar')).not.toThrow());
  });

  describe('authentication', () => {
    describe('public client', () => {
      it('works', () => expect(() => assertRequestAuthentication(client, headers, {})).not.toThrow());
      it('throws if authorization header was provided', () => expect(() => assertRequestAuthentication(client, new Headers({ 'Authorization': 'Basic foo' }), {})).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Do not pass authorization for public clients.'));
      it('throws if client secret was provided', () => expect(() => assertRequestAuthentication(client, headers, { client_secret: '' })).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Do not pass authorization for public clients.'));
    });

    describe('confidential client', () => {
      let secret: Awaited<ReturnType<typeof generateClientSecretAndHash>>;
      let confidentialClient: typeof client;

      beforeAll(async () => {
        secret = await generateClientSecretAndHash();
        confidentialClient = { ...client, type: ClientType.Confidential, secrets: [{ secret: secret.hashed } as ClientSecret] };
      });

      it('throws if no authentication was provided', () => expect(() => assertRequestAuthentication(confidentialClient, headers, {})).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing authorization for confidential client'));
      it('handles non basic auth header', () => expect(() => assertRequestAuthentication(confidentialClient, new Headers({ 'Authorization': 'Bearer foo' }), {})).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Only "Basic" authorization is supported using the Authorization header'));
      it('handles malformed basic auth header', () => expect(() => assertRequestAuthentication(confidentialClient, new Headers({ 'Authorization': 'Basic !"§$' }), {})).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Unexpected client_id in Authorization header'));
      it('supports client_secret_basic', () => expect(() => assertRequestAuthentication(confidentialClient, new Headers({ 'Authorization': `Basic ${btoa(`${client.id}:${secret.raw}`)}` }), {})).not.toThrow());
      it('supports client_secret_post', () => expect(() => assertRequestAuthentication(confidentialClient, headers, { client_secret: secret.raw })).not.toThrow());
    });
  });
});
