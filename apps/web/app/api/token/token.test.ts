/** @jest-environment node */
import { expect, describe, it } from '@jest/globals';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { handleTokenRequest } from './token';

describe('/api/token', () => {
  describe('errors', () => {
    it('Missing client_id', () => expect(handleTokenRequest({})).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing client_id'));
    it('Missing grant_type', () => expect(handleTokenRequest({ client_id: 'test' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));
    it('Invalid grant_type', () => expect(handleTokenRequest({ client_id: 'test', grant_type: 'foo' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type'));

    describe('authorization_code', () => {
      it('Missing code', () => expect(handleTokenRequest({ client_id: 'test', grant_type: 'authorization_code' })).rejects.toBeOAuth2Error(OAuth2ErrorCode.invalid_request, 'Missing code'));
    });

    // TODO: add additional tests
  });
});
