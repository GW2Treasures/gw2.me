/** @jest-environment node */
import { expect, describe, it } from '@jest/globals';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { handleTokenRequest } from './token';
import { dbMock } from '@/lib/db.mock';
import { Account, Application, Authorization } from '@gw2me/database';
import { expiresAt } from '@/lib/date';
import { Scope } from '@gw2me/client';

const mockAuthorization: Authorization & { application: Pick<Application, 'type' | 'clientSecret'>, accounts: Pick<Account, 'id'>[] } = {
  id: 'id',
  applicationId: 'app-id',
  codeChallenge: 'challenge',
  expiresAt: expiresAt(60),
  redirectUri: '/redirect',
  createdAt: new Date(),
  scope: [Scope.Identify],
  token: 'token',
  type: 'Code',
  updatedAt: new Date(),
  usedAt: new Date(),
  userId: 'user-id',
  application: {
    clientSecret: 'client-secret',
    type: 'Confidential'
  },
  accounts: []
};

describe('/api/token', () => {
  describe('errors', () => {
    it('Missing client_id', () => expect(handleTokenRequest({})).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing client_id'));
    it('Missing grant_type', () => expect(handleTokenRequest({ client_id: 'test' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));
    it('Invalid grant_type', () => expect(handleTokenRequest({ client_id: 'test', grant_type: 'foo' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));

    describe('authorization_code', () => {
      it('Missing code', () => expect(handleTokenRequest({ client_id: 'test', grant_type: 'authorization_code' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing code'));
      it('Missing redirect_uri', () => expect(handleTokenRequest({ client_id: 'test', grant_type: 'authorization_code', code: 'foo' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing redirect_uri'));

      it('Wrong code', async () => {
        dbMock.authorization.findUnique.mockResolvedValue(null);
        await expect(handleTokenRequest({ client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'Invalid code');
      });

      it('Expired code', async () => {
        dbMock.authorization.findUnique.mockResolvedValue({ ...mockAuthorization, expiresAt: new Date(0) });
        await expect(handleTokenRequest({ client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/redirect' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'code expired');
      });

      it('Invalid redirect_uri', async () => {
        dbMock.authorization.findUnique.mockResolvedValue(mockAuthorization);
        await expect(handleTokenRequest({ client_id: 'test', grant_type: 'authorization_code', code: 'foo', redirect_uri: '/wrong' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_grant, 'Invalid redirect_url');
      });
    });

    // TODO: add additional tests
  });
});
