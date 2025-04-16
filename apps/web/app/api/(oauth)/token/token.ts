import { expiresAt, isExpired } from '@/lib/date';
import { db } from '@/lib/db';
import { assert } from '@/lib/oauth/assert';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { generateAccessToken, generateRefreshToken } from '@/lib/token';
import { TokenResponse } from '@gw2me/client';
import { ClientType, AuthorizationType } from '@gw2me/database';
import { createHash } from 'crypto';
import { OAuth2RequestHandlerProps } from '../request';
import { checkProof } from '@/lib/oauth/dpop';

// 7 days
const ACCESS_TOKEN_EXPIRATION = 604800;

export async function handleTokenRequest({ headers, params, requestAuthorization, url }: OAuth2RequestHandlerProps): Promise<TokenResponse> {
  // get grant_type
  const grant_type = params['grant_type'];
  assert(isValidGrantType(grant_type), OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type');

  // get client_id from params
  const client_id = params.client_id;
  assert(client_id, OAuth2ErrorCode.invalid_request, 'Missing client_id');

  // get authorized client
  const { client } = requestAuthorization;
  assert(client.id === client_id, OAuth2ErrorCode.invalid_request, 'client_id param does not match authorization.');

  switch(grant_type) {
    case 'authorization_code': {
      const code = params['code'];
      const redirect_uri = params['redirect_uri'];
      const code_verifier = params['code_verifier'];

      // make sure code and redirect_uri are set
      assert(code, OAuth2ErrorCode.invalid_request, 'Missing code');
      assert(redirect_uri, OAuth2ErrorCode.invalid_request, 'Missing redirect_uri');

      // find code
      const authorization = await db.authorization.findUnique({
        where: {
          type_token: { token: code, type: AuthorizationType.Code },
          clientId: client.id
        },
      });

      assert(authorization, OAuth2ErrorCode.invalid_grant, 'Invalid code');
      assert(!isExpired(authorization.expiresAt), OAuth2ErrorCode.invalid_grant, 'code expired');

      if(authorization.redirectUri !== null) {
        // authorization.redirectUri is currently only `null` for FedCM
        // TODO: maybe set to "fed-cm" or something instead?
        assert(authorization.redirectUri === redirect_uri, OAuth2ErrorCode.invalid_grant, 'Invalid redirect_url');
      }

      assertPKCECodeChallenge(authorization.codeChallenge, code_verifier);

      // DPoP
      const proof = headers.get('dpop');

      // if the authorization is DPoP bound, the DPoP header is required
      if(authorization.dpopJkt) {
        assert(proof, OAuth2ErrorCode.invalid_dpop_proof, 'DPoP proof required');
      }

      const dpop = proof
        ? await checkProof(proof, { htm: 'POST', htu: url, accessToken: authorization.dpopJkt ? authorization.token : undefined }, authorization.dpopJkt)
        : undefined;


      const { clientId, applicationId, userId, scope } = authorization;

      // TODO(dpop): If DPoP (and PKCE) is used allow public clients to create refresh tokens
      const canCreateRefreshToken = client.type === ClientType.Confidential;

      const [refreshAuthorization, accessAuthorization] = await db.$transaction([
        // create refresh token
        canCreateRefreshToken
          ? db.authorization.upsert({
              where: { type_clientId_userId: { type: AuthorizationType.RefreshToken, clientId, userId }},
              create: { type: AuthorizationType.RefreshToken, clientId, applicationId, userId, scope, token: generateRefreshToken() },
              update: { scope }
            })
          : db.authorization.findFirst({ take: 0 }),

        // create access token
        db.authorization.upsert({
          where: { type_clientId_userId: { type: AuthorizationType.AccessToken, clientId, userId }},
          create: { type: AuthorizationType.AccessToken, clientId, applicationId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION), dpopJkt: dpop?.jkt },
          update: { scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION), dpopJkt: dpop?.jkt ?? null }
        }),

        // delete used code token
        db.authorization.delete({ where: { id: authorization.id }}),
      ]);

      return {
        access_token: accessAuthorization.token,
        issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        token_type: dpop ? 'DPoP' : 'Bearer',
        expires_in: ACCESS_TOKEN_EXPIRATION,
        refresh_token: refreshAuthorization?.token,
        scope: scope.join(' ')
      };
    }

    case 'refresh_token': {
      // refresh tokens can only be used by confidential clients
      assert(client.type === ClientType.Confidential, OAuth2ErrorCode.invalid_request, 'refresh_token can only be used by confidential clients');

      // get refresh token
      const refresh_token = params['refresh_token'];
      assert(refresh_token, OAuth2ErrorCode.invalid_request, 'Missing refresh_token');

      const refreshAuthorization = await db.authorization.findUnique({
        where: {
          type_token: { token: refresh_token, type: AuthorizationType.RefreshToken },
          clientId: client.id
        }
      });

      assert(refreshAuthorization, OAuth2ErrorCode.invalid_grant, 'Invalid refresh_token');
      assert(!isExpired(refreshAuthorization.expiresAt), OAuth2ErrorCode.invalid_grant, 'refresh_token expired');

      // DPoP
      const proof = headers.get('dpop');

      // if the authorization is DPoP bound, the DPoP header is required
      if(refreshAuthorization.dpopJkt) {
        assert(proof, OAuth2ErrorCode.invalid_dpop_proof, 'DPoP proof required');
      }

      const dpop = proof
        ? await checkProof(proof, { htm: 'POST', htu: url, accessToken: refreshAuthorization.dpopJkt ? refreshAuthorization.token : undefined }, refreshAuthorization.dpopJkt)
        : undefined;

      const { clientId, applicationId, userId, scope } = refreshAuthorization;

      const [accessAuthorization] = await db.$transaction([
        // create new access token
        db.authorization.upsert({
          where: { type_clientId_userId: { type: AuthorizationType.AccessToken, clientId, userId }},
          create: { type: AuthorizationType.AccessToken, clientId, applicationId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION), dpopJkt: dpop?.jkt },
          update: { scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION), dpopJkt: dpop?.jkt ?? null }
        }),

        // set last used on refresh token
        db.authorization.update({ where: { id: refreshAuthorization.id }, data: { usedAt: new Date() }}),
      ]);

      return {
        access_token: accessAuthorization.token,
        issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        token_type: dpop ? 'DPoP' : 'Bearer',
        expires_in: ACCESS_TOKEN_EXPIRATION,
        refresh_token: refreshAuthorization.token,
        scope: scope.join(' ')
      };
    }
  }
}

function isValidGrantType(grant_type: string | undefined): grant_type is 'authorization_code' | 'refresh_token' {
  return grant_type === 'authorization_code' || grant_type === 'refresh_token';
}

// instead of returning false if some check fails, throw OAuth2Error with description why code challenge failed
export function assertPKCECodeChallenge(codeChallenge: string | null, codeVerifier: string | undefined): void {
  // no challenge needs to be completed
  if(!codeChallenge) {
    return;
  }

  // handle missing code verifier
  if(!codeVerifier) {
    throw new OAuth2Error(OAuth2ErrorCode.invalid_request, { description: 'code_verifier missing' });
  }

  // parse stored challenge
  const [method, challenge] = codeChallenge.split(':', 2);

  // calculate hash and compare
  switch(method) {
    case 'S256': {
      const hash = createHash('sha256').update(codeVerifier).digest('base64url');
      return assert(challenge === hash, OAuth2ErrorCode.invalid_request, 'code challenge verification failed');
    }
    default:
      throw new OAuth2Error(OAuth2ErrorCode.invalid_request, { description: 'Unsupported code challenge' });
  }
}
