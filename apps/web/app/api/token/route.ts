import { corsHeaders } from '@/lib/cors-header';
import { expiresAt, isExpired } from '@/lib/date';
import { db } from '@/lib/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/token';
import { TokenResponse } from '@gw2me/client';
import { ApplicationType, AuthorizationType, Prisma, PrismaClient } from '@gw2me/database';
import { createHash, scryptSync, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 7 days
const EXPIRES_IN = 604800;

function isValidGrantType(grant_type: string | undefined): grant_type is 'authorization_code' | 'refresh_token' {
  return grant_type === 'authorization_code' || grant_type === 'refresh_token';
}

export async function POST(request: NextRequest) {
  const params = await request.formData();

  const client_id = params.get('client_id')?.toString();
  const client_secret = params.get('client_secret')?.toString();
  const grant_type = params.get('grant_type')?.toString();

  if(!client_id || !isValidGrantType(grant_type)) {
    return NextResponse.json({ error: true }, { status: 400 });
  }

  switch(grant_type) {
    case 'authorization_code': {
      const code = params.get('code')?.toString();
      const redirect_uri = params.get('redirect_uri')?.toString();
      const code_verifier = params.get('code_verifier')?.toString();

      if(!code || !redirect_uri) {
        return NextResponse.json({ error: true }, { status: 400 });
      }

      // find code
      const authorization = await db.authorization.findUnique({ where: { type_token: { token: code, type: AuthorizationType.Code }}, include: { application: true, accounts: { select: { id: true }}}});

      if(
        !authorization ||
        isExpired(authorization.expiresAt) ||
        authorization.application.clientId !== client_id ||
        (authorization.redirectUri !== null && authorization.redirectUri !== redirect_uri) ||
        !verifyCodeChallenge(authorization.codeChallenge, code_verifier) ||
        (authorization.application.type === ApplicationType.Confidential && (!client_secret || !validClientSecret(client_secret, authorization.application.clientSecret)))
      ) {
        return NextResponse.json({ error: true }, { status: 400 });
      }

      const { applicationId, userId, scope, accounts } = authorization;

      const [refreshAuthorization, accessAuthorization, _] = await db.$transaction([
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
          create: { type: AuthorizationType.AccessToken, applicationId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(EXPIRES_IN), accounts: { connect: accounts }},
          update: { scope, accounts: { set: accounts }, token: generateAccessToken(), expiresAt: expiresAt(EXPIRES_IN) }
        }),

        // delete used code token
        db.authorization.delete({ where: { id: authorization.id }})
      ]);

      const response: TokenResponse = {
        access_token: accessAuthorization.token,
        token_type: 'Bearer',
        expires_in: EXPIRES_IN,
        refresh_token: refreshAuthorization?.token,
        scope: scope.join(' ')
      };

      return NextResponse.json(response, {
        headers: corsHeaders(request)
      });
    }

    case 'refresh_token': {
      const refresh_token = params.get('refresh_token')?.toString();

      if(!refresh_token || !client_secret) {
        return NextResponse.json({ error: true }, { status: 400 });
      }

      const refreshAuthorization = await db.authorization.findUnique({ where: { type_token: { token: refresh_token, type: AuthorizationType.RefreshToken }}, include: { application: true }});

      if(!refreshAuthorization || isExpired(refreshAuthorization.expiresAt) || refreshAuthorization.application.clientId !== client_id || !validClientSecret(client_secret, refreshAuthorization.application.clientSecret)) {
        return NextResponse.json({ error: true }, { status: 400 });
      }

      const { applicationId, userId, scope } = refreshAuthorization;

      // create new access token
      const accessAuthorization = await db.authorization.upsert({
        where: { type_applicationId_userId: { type: AuthorizationType.AccessToken, applicationId, userId }},
        create: { type: AuthorizationType.AccessToken, applicationId, userId, scope, token: generateAccessToken(), expiresAt: expiresAt(EXPIRES_IN) },
        update: { scope, token: generateAccessToken(), expiresAt: expiresAt(EXPIRES_IN) }
      });

      // set last used to refresh token
      await db.authorization.update({ where: { id: refreshAuthorization.id }, data: { usedAt: new Date() }});

      const response: TokenResponse = {
        access_token: accessAuthorization.token,
        token_type: 'Bearer',
        expires_in: EXPIRES_IN,
        refresh_token: refreshAuthorization.token,
        scope: scope.join(' ')
      };

      return NextResponse.json(response, {
        headers: corsHeaders(request)
      });
    }
  }
}

export const OPTIONS = (request: Request) => {
  return new NextResponse(null, {
    headers: corsHeaders(request)
  });
};

function validClientSecret(clientSecret: string, saltedHash: string | null) {
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

function verifyCodeChallenge(codeChallenge: string | null, codeVerifier: string | undefined) {
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
      return challenge === createHash('sha256').update(codeVerifier).digest('base64url');;
  }

  // method not supported -> fail
  return false;
}
