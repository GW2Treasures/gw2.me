import { expiresAt, isExpired } from '@/lib/date';
import { db } from '@/lib/db';
import { assert } from '@/lib/oauth/assert';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { generateAccessToken, generateRefreshToken } from '@/lib/token';
import { TokenResponse } from '@gw2me/client';
import { ApplicationType, AuthorizationType } from '@gw2me/database';
import { createHash, scryptSync, timingSafeEqual } from 'crypto';

// 7 days
const ACCESS_TOKEN_EXPIRATION = 604800;

export async function handleTokenRequest(params: Record<string, string | undefined>): Promise<TokenResponse> {
  const client_id = params['client_id'];
  const client_secret = params['client_secret'];
  const grant_type = params['grant_type'];

  // validate client_id and grant_type
  assert(client_id, OAuth2ErrorCode.invalid_request, 'Missing client_id');
  assert(isValidGrantType(grant_type), OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type');

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
          application: { clientId: client_id }
        },
        // TODO: replace with select to only load necessary fields
        include: { application: true, accounts: { select: { id: true }}}
      });

      assert(authorization, OAuth2ErrorCode.invalid_grant, 'Invalid code');
      assert(!isExpired(authorization.expiresAt), OAuth2ErrorCode.invalid_grant, 'code expired');

      if(authorization.redirectUri !== null) {
        // authorization.redirectUri is currently only `null` for FedCM
        // TODO: maybe set to "fed-cm" or something instead?
        assert(authorization.redirectUri === redirect_uri, OAuth2ErrorCode.invalid_grant, 'Invalid redirect_url');
      }

      assert(verifyPKCECodeChallenge(authorization.codeChallenge, code_verifier), OAuth2ErrorCode.invalid_request, 'code challenge verification failed');

      // confidential applications need a valid client_secret
      if(authorization.application.type === ApplicationType.Confidential) {
        assert(client_secret, OAuth2ErrorCode.invalid_request, 'Missing client_secret');
        assert(isValidClientSecret(client_secret, authorization.application.clientSecret), OAuth2ErrorCode.invalid_client, 'Invalid client_secret');
      }

      const { applicationId, userId, scope, accounts } = authorization;

      const [refreshAuthorization, accessAuthorization] = await db.$transaction([
        // create refresh token
        authorization.application.type === ApplicationType.Confidential
          ? db.authorization.upsert({
              where: { type_applicationId_userId: { type: AuthorizationType.RefreshToken, applicationId, userId }},
              create: { type: AuthorizationType.RefreshToken, applicationId, userId, scope, token: generateRefreshToken(), accounts: { connect: accounts }},
              update: { scope, accounts: { set: accounts }}
            })
          : db.authorization.findFirst({ take: 0 }),

        // create access token
        db.authorization.upsert({
          where: { type_applicationId_userId: { type: AuthorizationType.AccessToken, applicationId, userId }},
          create: { type: AuthorizationType.AccessToken, applicationId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION), accounts: { connect: accounts }},
          update: { scope, accounts: { set: accounts }, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) }
        }),

        // delete used code token
        db.authorization.delete({ where: { id: authorization.id }})
      ]);

      return {
        access_token: accessAuthorization.token,
        token_type: 'Bearer',
        expires_in: ACCESS_TOKEN_EXPIRATION,
        refresh_token: refreshAuthorization?.token,
        scope: scope.join(' ')
      };
    }

    case 'refresh_token': {
      const refresh_token = params['refresh_token'];

      assert(refresh_token, OAuth2ErrorCode.invalid_request, 'Missing refresh_token');
      assert(client_secret, OAuth2ErrorCode.invalid_request, 'Missing client_secret');

      const refreshAuthorization = await db.authorization.findUnique({
        where: {
          type_token: { token: refresh_token, type: AuthorizationType.RefreshToken },
          application: { clientId: client_id, type: ApplicationType.Confidential }
        },
        // TODO: replace with select to only load necessary fields
        include: { application: true }
      });

      assert(refreshAuthorization, OAuth2ErrorCode.invalid_grant, 'Invalid refresh_token');
      assert(!isExpired(refreshAuthorization.expiresAt), OAuth2ErrorCode.invalid_grant, 'refresh_token expired');

      assert(isValidClientSecret(client_secret, refreshAuthorization.application.clientSecret), OAuth2ErrorCode.invalid_client, 'Invalid client_secret');

      const { applicationId, userId, scope } = refreshAuthorization;

      // create new access token
      const accessAuthorization = await db.authorization.upsert({
        where: { type_applicationId_userId: { type: AuthorizationType.AccessToken, applicationId, userId }},
        create: { type: AuthorizationType.AccessToken, applicationId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) },
        update: { scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) }
      });

      // set last used to refresh token
      await db.authorization.update({ where: { id: refreshAuthorization.id }, data: { usedAt: new Date() }});

      return {
        access_token: accessAuthorization.token,
        token_type: 'Bearer',
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

function isValidClientSecret(clientSecret: string, saltedHash: string | null): boolean {
  if(saltedHash === null) {
    return false;
  }

  const [salt, hash] = saltedHash.split(':');

  const saltBuffer = Buffer.from(salt, 'base64');
  const hashBuffer = Buffer.from(hash, 'base64');
  const secretBuffer = Buffer.from(clientSecret, 'base64url');

  const derived = scryptSync(secretBuffer, saltBuffer, 32);
  return timingSafeEqual(hashBuffer, derived);
}

// instead of returning false if some check fails, throw OAuth2Error with description why code challenge failed
function verifyPKCECodeChallenge(codeChallenge: string | null, codeVerifier: string | undefined): boolean {
  // no challenge needs to be completed
  if(!codeChallenge) {
    return true;
  }

  // handle missing code verifier
  if(!codeVerifier) {
    return false;
  }

  // parse stored challenge
  const [method, challenge] = codeChallenge.split(':', 2);

  // calculate hash and compare
  switch(method) {
    case 'S256':
      return challenge === createHash('sha256').update(codeVerifier).digest('base64url');
  }

  // method not supported -> fail
  return false;
}
