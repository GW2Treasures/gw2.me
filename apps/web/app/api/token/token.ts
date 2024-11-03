import { expiresAt, isExpired } from '@/lib/date';
import { db } from '@/lib/db';
import { assert } from '@/lib/oauth/assert';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { generateAccessToken, generateRefreshToken } from '@/lib/token';
import { TokenResponse } from '@gw2me/client';
import { ClientType, AuthorizationType } from '@gw2me/database';
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
          clientId: client_id
        },
        include: {
          client: { select: { type: true, secret: true }},
          accounts: { select: { id: true }}
        }
      });

      assert(authorization, OAuth2ErrorCode.invalid_grant, 'Invalid code');
      assert(!isExpired(authorization.expiresAt), OAuth2ErrorCode.invalid_grant, 'code expired');

      if(authorization.redirectUri !== null) {
        // authorization.redirectUri is currently only `null` for FedCM
        // TODO: maybe set to "fed-cm" or something instead?
        assert(authorization.redirectUri === redirect_uri, OAuth2ErrorCode.invalid_grant, 'Invalid redirect_url');
      }

      assertPKCECodeChallenge(authorization.codeChallenge, code_verifier);

      // confidential applications need a valid client_secret
      if(authorization.client.type === ClientType.Confidential) {
        assert(client_secret, OAuth2ErrorCode.invalid_request, 'Missing client_secret');
        assert(isValidClientSecret(client_secret, authorization.client.secret), OAuth2ErrorCode.invalid_client, 'Invalid client_secret');
      }

      const { clientId, userId, scope, accounts, emailId } = authorization;

      const [refreshAuthorization, accessAuthorization] = await db.$transaction([
        // create refresh token
        authorization.client.type === ClientType.Confidential
          ? db.authorization.upsert({
              where: { type_clientId_userId: { type: AuthorizationType.RefreshToken, clientId, userId }},
              create: { type: AuthorizationType.RefreshToken, clientId, userId, scope, token: generateRefreshToken(), accounts: { connect: accounts }, emailId },
              update: { scope, accounts: { set: accounts }, emailId }
            })
          : db.authorization.findFirst({ take: 0 }),

        // create access token
        db.authorization.upsert({
          where: { type_clientId_userId: { type: AuthorizationType.AccessToken, clientId, userId }},
          create: { type: AuthorizationType.AccessToken, clientId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION), accounts: { connect: accounts }, emailId },
          update: { scope, accounts: { set: accounts }, emailId, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) }
        }),

        // delete used code token
        db.authorization.delete({ where: { id: authorization.id }})
      ]);

      return {
        access_token: accessAuthorization.token,
        issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
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
          client: { id: client_id, type: ClientType.Confidential }
        },
        include: {
          client: { select: { secret: true }}
        }
      });

      assert(refreshAuthorization, OAuth2ErrorCode.invalid_grant, 'Invalid refresh_token');
      assert(!isExpired(refreshAuthorization.expiresAt), OAuth2ErrorCode.invalid_grant, 'refresh_token expired');

      assert(isValidClientSecret(client_secret, refreshAuthorization.client.secret), OAuth2ErrorCode.invalid_client, 'Invalid client_secret');

      const { clientId, userId, scope } = refreshAuthorization;

      // create new access token
      const accessAuthorization = await db.authorization.upsert({
        where: { type_clientId_userId: { type: AuthorizationType.AccessToken, clientId, userId }},
        create: { type: AuthorizationType.AccessToken, clientId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) },
        update: { scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) }
      });

      // set last used to refresh token
      await db.authorization.update({ where: { id: refreshAuthorization.id }, data: { usedAt: new Date() }});

      return {
        access_token: accessAuthorization.token,
        issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
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
