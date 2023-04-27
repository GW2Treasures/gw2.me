import { expiresAt, isExpired } from '@/lib/date';
import { db } from '@/lib/db';
import { TokenResponse } from '@gw2me/api';
import { AuthorizationType } from '@gw2me/database';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

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
  const code = params.get('code')?.toString();
  const redirect_uri = params.get('redirect_uri')?.toString();

  if(!client_id || !client_secret || !isValidGrantType(grant_type) || !code || !redirect_uri) {
    return NextResponse.json({ error: true }, { status: 400 });
  }

  switch(grant_type) {
    case 'authorization_code': {
      // find code
      const authorization = await db.authorization.findUnique({ where: { token: code }, include: { application: true }});

      if(!authorization || authorization.type !== AuthorizationType.Code || isExpired(authorization.expiresAt) || authorization.application.clientId !== client_id || !validClientSecret(client_secret, authorization.application.clientSecret)) {
        return NextResponse.json({ error: true }, { status: 400 });
      }

      const { applicationId, userId, scope } = authorization;

      const [refreshAuthorization, accessAuthorization, _] = await db.$transaction([
        // create refresh token
        db.authorization.upsert({
          where: { type_applicationId_userId: { type: AuthorizationType.RefreshToken, applicationId, userId }},
          create: { type: AuthorizationType.RefreshToken, applicationId, userId, scope, token: randomBytes(16).toString('hex') },
          update: { scope }
        }),

        // create access token
        db.authorization.upsert({
          where: { type_applicationId_userId: { type: AuthorizationType.AccessToken, applicationId, userId }},
          create: { type: AuthorizationType.AccessToken, applicationId, userId, scope, token: randomBytes(16).toString('hex'), expiresAt: expiresAt(EXPIRES_IN) },
          update: { scope, token: randomBytes(16).toString('hex'), expiresAt: expiresAt(EXPIRES_IN) }
        }),

        // delete used code token
        db.authorization.delete({ where: { id: authorization.id }})
      ]);

      const response: TokenResponse = {
        access_token: accessAuthorization.token,
        token_type: 'Bearer',
        expires_in: EXPIRES_IN,
        refresh_token: refreshAuthorization.token,
        scope: scope.join(' ')
      };

      return NextResponse.json(response);
    }

    case 'refresh_token': {
      const refreshAuthorization = await db.authorization.findUnique({ where: { token: code }, include: { application: true }});

      if(!refreshAuthorization || refreshAuthorization.type !== AuthorizationType.RefreshToken || isExpired(refreshAuthorization.expiresAt) || refreshAuthorization.application.clientId !== client_id || !validClientSecret(client_secret, refreshAuthorization.application.clientSecret)) {
        return NextResponse.json({ error: true }, { status: 400 });
      }

      const { applicationId, userId, scope } = refreshAuthorization;

      // create new access token
      const accessAuthorization = await db.authorization.upsert({
        where: { type_applicationId_userId: { type: AuthorizationType.AccessToken, applicationId, userId }},
        create: { type: AuthorizationType.AccessToken, applicationId, userId, scope, token: randomBytes(16).toString('hex'), expiresAt: expiresAt(EXPIRES_IN) },
        update: { scope, token: randomBytes(16).toString('hex'), expiresAt: expiresAt(EXPIRES_IN) }
      });

      // set last used to refresh token
      db.authorization.update({ where: { id: refreshAuthorization.id }, data: { usedAt: new Date() }});

      const response: TokenResponse = {
        access_token: accessAuthorization.token,
        token_type: 'Bearer',
        expires_in: EXPIRES_IN,
        refresh_token: refreshAuthorization.token,
        scope: scope.join(' ')
      };

      return NextResponse.json(response);
    }
  }
}

function validClientSecret(clientSecret: string, saltedHash: string | null) {
  if(saltedHash === null) {
    return false;
  }

  const [salt, hash] = saltedHash.split(':');

  const saltBuffer = Buffer.from(salt, 'base64');
  const hashBuffer = Buffer.from(hash, 'base64');
  const secretBuffer = Buffer.from(clientSecret, 'base64url');

  const derived = scryptSync(secretBuffer, saltBuffer, 16);
  return timingSafeEqual(hashBuffer, derived);
}
