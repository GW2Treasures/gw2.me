/** @jest-environment node */
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { getRequestAuthorization, RequestAuthorization } from './auth';
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

describe('OAuth2 request authorization', () => {
  describe('public client', () => {
    beforeEach(() => {
      dbMock.client.findUnique.mockResolvedValue(client);
    });

    it('works', () =>
      expect(getRequestAuthorization(new Headers(), { client_id: client.id })).resolves.toStrictEqual({ method: 'none', client } satisfies RequestAuthorization));

    it('throws if client_secret_basic is used', () =>
      expect(getRequestAuthorization(new Headers({ 'Authorization': `Basic ${btoa(`${client.id}:xxx`)}` }), {}))
        .rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Invalid authorization provided for public client'));

    it('throws if client_secret_post is used', () =>
      expect(getRequestAuthorization(new Headers(), { client_id: client.id, client_secret: 'something' }))
        .rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Invalid authorization provided for public client'));
  });

  describe('confidential client', () => {
    let secret: Awaited<ReturnType<typeof generateClientSecretAndHash>>;
    let confidentialClient: typeof client;

    // generate confidential client
    beforeAll(async () => {
      secret = await generateClientSecretAndHash();
      confidentialClient = { ...client, type: ClientType.Confidential, secrets: [{ secret: secret.hashed } as ClientSecret] };
    });

    beforeEach(() => {
      dbMock.client.findUnique.mockResolvedValue(confidentialClient);
    });

    it('throws if no authentication was provided', () =>
      expect(getRequestAuthorization(new Headers(), {}))
        .rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'No client_id or authorization provided'));

    it('throws if non basic auth header was provided', () =>
      expect(getRequestAuthorization(new Headers({ 'Authorization': 'Bearer foo' }), {}))
        .rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Only "Basic" authorization is supported using the Authorization header'));

    it('throws if malformed basic auth header was provided', () =>
      expect(getRequestAuthorization(new Headers({ 'Authorization': 'Basic !"§$' }), {}))
        .rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Invalid basic authorization header'));

    it('supports client_secret_basic', () =>
      expect(getRequestAuthorization(new Headers({ 'Authorization': `Basic ${btoa(`${client.id}:${secret.raw}`)}` }), {}))
        .resolves.toStrictEqual({ method: 'client_secret_basic', client_secret: secret.raw, client: confidentialClient } satisfies RequestAuthorization));

    it('supports client_secret_post', () =>
      expect(getRequestAuthorization(new Headers(), { client_id: confidentialClient.id, client_secret: secret.raw }))
        .resolves.toStrictEqual({ method: 'client_secret_post', client_secret: secret.raw, client: confidentialClient } satisfies RequestAuthorization));
  });
});
