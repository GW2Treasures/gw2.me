import { expiresAt, isExpired } from '@/lib/date';
import { db } from '@/lib/db';
import { assert } from '@/lib/oauth/assert';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { AuthenticationMethod } from '@/lib/oauth/types';
import { generateAccessToken, generateRefreshToken } from '@/lib/token';
import { TokenResponse } from '@gw2me/client';
import { ClientType, AuthorizationType, ClientSecret, Client } from '@gw2me/database';
import { createHash, scryptSync, timingSafeEqual } from 'crypto';
import { unstable_after as after } from 'next/server';

// 7 days
const ACCESS_TOKEN_EXPIRATION = 604800;

export async function handleTokenRequest(headers: Headers, params: Record<string, string | undefined>): Promise<TokenResponse> {
  // get grant_type
  const grant_type = params['grant_type'];
  assert(isValidGrantType(grant_type), OAuth2ErrorCode.unsupported_grant_type, 'Invalid grant_type');

  // get client_id from params
  const client_id = params.client_id;
  assert(client_id, OAuth2ErrorCode.invalid_request, 'Missing client_id');

  // load client from db
  const client = await db.client.findUnique({
    where: { id: client_id },
    include: { secrets: true }
  });
  assert(client, OAuth2ErrorCode.invalid_client, 'Invalid client_id');

  // make sure request is authenticated
  assertRequestAuthentication(client, headers, params);

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
        include: {
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

      const { clientId, userId, scope, accounts, emailId } = authorization;

      const [refreshAuthorization, accessAuthorization] = await db.$transaction([
        // create refresh token
        client.type === ClientType.Confidential
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
        db.authorization.delete({ where: { id: authorization.id }}),
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

      const { clientId, userId, scope } = refreshAuthorization;

      const [accessAuthorization] = await db.$transaction([
        // create new access token
        db.authorization.upsert({
          where: { type_clientId_userId: { type: AuthorizationType.AccessToken, clientId, userId }},
          create: { type: AuthorizationType.AccessToken, clientId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) },
          update: { scope, token: generateAccessToken(), expiresAt: expiresAt(ACCESS_TOKEN_EXPIRATION) }
        }),

        // set last used on refresh token
        db.authorization.update({ where: { id: refreshAuthorization.id }, data: { usedAt: new Date() }}),
      ]);

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

export function assertRequestAuthentication(
  client: Client & { secrets: ClientSecret[] },
  headers: Headers,
  params: Record<string, string | undefined>
): void {
  const authHeader = headers.get('Authorization');

  const authorizationMethods: Record<AuthenticationMethod, boolean> = {
    client_secret_basic: !!authHeader,
    client_secret_post: 'client_secret' in params,
  };

  const usedAuthentication = Object.entries(authorizationMethods)
    .filter(([, used]) => used)
    .map(([key]) => key as AuthenticationMethod);

  // no authentication provided
  if(usedAuthentication.length === 0) {
    assert(client.type === ClientType.Public, OAuth2ErrorCode.invalid_request, 'Missing authorization for confidential client');
    return;
  }

  // if authentication was provided, this needs to be a confidential client
  assert(client.type === ClientType.Confidential, OAuth2ErrorCode.invalid_request, 'Do not pass authorization for public clients.');

  // only allow 1 authorization method
  assert(usedAuthentication.length === 1, OAuth2ErrorCode.invalid_request, 'Only used one authorization method');

  const [method] = usedAuthentication;

  switch(method) {
    case 'client_secret_basic':
    case 'client_secret_post': {
      let client_secret: string | undefined;

      if(method === 'client_secret_basic') {
        const [id, password] = Buffer.from(authHeader!, 'base64').toString().split(':');
        assert(id !== client.id, OAuth2ErrorCode.invalid_request, 'Unexpected client_id in Authorization header');
        client_secret = password;
      } else {
        client_secret = params.client_secret;
      }

      assert(client_secret, OAuth2ErrorCode.invalid_request, 'Missing client_secret');

      const clientSecret = client.secrets.find(({ secret }) => isValidClientSecret(client_secret, secret));
      assert(clientSecret, OAuth2ErrorCode.invalid_client, 'Invalid client_secret');

      // set `usedAt` of secret
      after(() => db.clientSecret.update({
        where: { id: clientSecret.id },
        data: { usedAt: new Date() }
      }));
    }
  }
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
