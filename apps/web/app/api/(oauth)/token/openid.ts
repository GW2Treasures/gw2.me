import { createSigner } from 'fast-jwt';
import { RequestAuthentication } from '../auth';
import { getBaseUrlFromHeaders } from '@/lib/url';
import { ACCESS_TOKEN_EXPIRATION } from './token';
import { db } from '@/lib/db';
import { assert } from '@/lib/oauth/assert';
import { OAuth2ErrorCode } from '@/lib/oauth/error';

type IdTokenOptions = {
  clientId: string,
  requestAuthentication: RequestAuthentication
  userId: string,
  nonce: string,
}
export async function createIdToken({ userId, clientId, requestAuthentication, nonce }: IdTokenOptions) {
  const { origin: issuer } = await getBaseUrlFromHeaders();
  const issuedAt = toTimestamp(new Date());

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      // get latest created session to use as auth_time
      sessions: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  assert(user, OAuth2ErrorCode.server_error, 'user not found');

  const idToken = {
    iss: issuer,
    sub: userId,
    aud: [clientId],
    exp: issuedAt + ACCESS_TOKEN_EXPIRATION,
    iat: issuedAt,
    auth_time: toTimestamp(user.sessions[0].createdAt),
    nonce: nonce
  };

  // if the token request was authenticated using a client secret
  // use the client secret as symmetric key to sign the JWT
  if(requestAuthentication.method === 'client_secret_basic' || requestAuthentication.method === 'client_secret_post') {
    const jwt = createSigner({
      algorithm: 'HS256',
      key: requestAuthentication.client_secret
    })(idToken);

    return jwt;
  }
}

function toTimestamp(date: Date): number {
  return Math.floor(date.valueOf() / 1000);
}
