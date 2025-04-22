// @vitest-environment node
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { assertPKCECodeChallenge, handleTokenRequest } from './token';
import { dbMock } from '@/lib/db.mock';
import { Account, Authorization, Client } from '@gw2me/database';
import { expiresAt } from '@/lib/date';
import { Scope } from '@gw2me/client';
import { describe, expect, it, beforeEach } from 'vitest';
import { OAuth2RequestHandlerProps } from '../request';

type MockAuthorization = Authorization & { accounts: Pick<Account, 'id'>[] };

const mockAuthorization: MockAuthorization = {
  id: 'id',
  clientId: 'client-id',
  applicationId: 'app-id',
  codeChallenge: null,
  dpopJkt: null,
  expiresAt: expiresAt(60),
  redirectUri: '/redirect',
  createdAt: new Date(),
  scope: [Scope.Identify],
  token: 'token',
  type: 'Code',
  updatedAt: new Date(),
  usedAt: new Date(),
  userId: 'user-id',
  accounts: [],
};

const client: Client = {
  id: 'test',
  name: 'test',
  applicationId: 'app-id',
  callbackUrls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  type: 'Public',
};

const request = (params: Record<string, string>): OAuth2RequestHandlerProps => ({
  headers: new Headers(),
  url: new URL('https://gw2.me/api/token'),
  params: { client_id: client.id, ...params },
  requestAuthorization: { method: 'none', client }
});

describe('/api/token', () => {
  beforeEach(() => {
    dbMock.client.findUnique.mockResolvedValue(client);
  });

  describe('errors', () => {
    it('Missing client_id', () => expect(handleTokenRequest(request({ client_id: '', grant_type: 'authorization_code' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing client_id'));

    it('Missing grant_type', () => expect(handleTokenRequest(request({}))).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));
    it('Invalid grant_type', () => expect(handleTokenRequest(request({ grant_type: 'foo' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));

    describe('authorization_code', () => {
      it('Missing code', () => expect(handleTokenRequest(request({ grant_type: 'authorization_code' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing code'));
      it('Missing redirect_uri', () => expect(handleTokenRequest(request({ grant_type: 'authorization_code', code: 'foo' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing redirect_uri'));

      it('Wrong code', async () => {
        dbMock.authorization.findUnique.mockResolvedValue(null);
        await expect(handleTokenRequest(request({ grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'Invalid code');
      });

      it('Expired code', async () => {
        dbMock.authorization.findUnique.mockResolvedValue({ ...mockAuthorization, expiresAt: new Date(0) });
        await expect(handleTokenRequest(request({ grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'code expired');
      });

      it('Invalid redirect_uri', async () => {
        dbMock.authorization.findUnique.mockResolvedValue(mockAuthorization);
        await expect(handleTokenRequest(request({ grant_type: 'authorization_code', code: 'foo', redirect_uri: '/wrong' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'Invalid redirect_url');
      });

      it('Requires code_verifier', async () => {
        dbMock.authorization.findUnique.mockResolvedValue({ ...mockAuthorization, codeChallenge: 'challenge' });
        await expect(handleTokenRequest(request({ grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' }))).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'code_verifier missing');
      });
    });

    describe.skip('refresh_token', () => {
      // TODO: add refresh token tests
    });
  });

  describe('authorization_code', () => {
    it('returns access_token', async () => {
      dbMock.authorization.findUnique.mockResolvedValue(mockAuthorization);
      dbMock.authorization.upsert.mockResolvedValue({ token: 'token' } as MockAuthorization);

      const response = await handleTokenRequest(request({ grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' }));
      expect(response.access_token).toBeDefined();
      expect(response.refresh_token).toBeUndefined();
    });

    it('returns refresh_token for confidential client', async () => {
      dbMock.authorization.findUnique.mockResolvedValue(mockAuthorization);
      dbMock.authorization.upsert.mockResolvedValue({ token: 'token' } as MockAuthorization);

      const confidentialClient: Client = { ...client, type: 'Confidential' };

      const response = await handleTokenRequest({
        headers: new Headers(),
        url: new URL('https://gw2.me/api/token'),
        params: { client_id: confidentialClient.id, grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' },
        requestAuthorization: { method: 'client_secret_basic', client: confidentialClient, client_secret: 'client_secret' }
      });
      expect(response.access_token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
    });


  });

  describe('PKCE challenge', () => {
    it('no challenge', () => expect(() => assertPKCECodeChallenge(null, undefined)).not.toThrow());
    it('missing verifier', () => expect(() => assertPKCECodeChallenge('S256:challenge', undefined)).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'code_verifier missing'));
    it('unknown method', () => expect(() => assertPKCECodeChallenge('foo:challenge', 'bar')).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Unsupported code challenge'));
    it('wrong verifier', () => expect(() => assertPKCECodeChallenge('S256:challenge', 'wrong')).toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'code challenge verification failed'));
    it('success', () => expect(() => assertPKCECodeChallenge('S256:w6uP8Tcg6K2QR905Rms8iXTlksL6OD1KOWBxTK7wxPI', 'foobar')).not.toThrow());
  });
});
