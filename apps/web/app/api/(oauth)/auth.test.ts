/** @jest-environment node */
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { assertRequestAuthentication } from './auth';
import { dbMock } from '@/lib/db.mock';
import { Client, ClientSecret, ClientType } from '@gw2me/database';
import { describe, expect, it } from '@jest/globals';
import { generateClientSecretAndHash } from '@/lib/token';

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

describe('authentication', () => {
  beforeEach(() => {
    dbMock.client.findUnique.mockResolvedValue(client);
  });

  describe('public client', () => {
    it('works', () =>
      expect(() => assertRequestAuthentication(client, headers, {})).not.toThrow());
    it('throws if authorization header was provided', () =>
      expect(() => assertRequestAuthentication(client, new Headers({ 'Authorization': 'Basic foo' }), {}))
        .toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Do not pass authorization for public clients.'));
    it('throws if client secret was provided', () =>
      expect(() => assertRequestAuthentication(client, headers, { client_secret: '' }))
        .toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Do not pass authorization for public clients.'));
  });

  describe('confidential client', () => {
    let secret: Awaited<ReturnType<typeof generateClientSecretAndHash>>;
    let confidentialClient: typeof client;

    beforeAll(async () => {
      secret = await generateClientSecretAndHash();
      confidentialClient = { ...client, type: ClientType.Confidential, secrets: [{ secret: secret.hashed } as ClientSecret] };
    });

    it('throws if no authentication was provided', () =>
      expect(() => assertRequestAuthentication(confidentialClient, headers, {}))
        .toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing authorization for confidential client'));

    it('throws if non basic auth header was provided', () =>
      expect(() => assertRequestAuthentication(confidentialClient, new Headers({ 'Authorization': 'Bearer foo' }), {}))
        .toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Only "Basic" authorization is supported using the Authorization header'));

    it('throws if malformed basic auth header was provided', () =>
      expect(() => assertRequestAuthentication(confidentialClient, new Headers({ 'Authorization': 'Basic !"§$' }), {}))
        .toThrowOAuth2Error(OAuth2ErrorCode.invalid_request, 'Unexpected client_id in Authorization header'));

    it('supports client_secret_basic', () =>
      expect(() => assertRequestAuthentication(confidentialClient, new Headers({ 'Authorization': `Basic ${btoa(`${client.id}:${secret.raw}`)}` }), {}))
        .not.toThrow());

    it('supports client_secret_post', () =>
      expect(() => assertRequestAuthentication(confidentialClient, headers, { client_secret: secret.raw }))
        .not.toThrow());
  });
});
