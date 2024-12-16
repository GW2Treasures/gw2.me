import { createSigner } from 'fast-jwt';
import { RequestAuthentication } from '../auth';
import { getBaseUrlFromHeaders } from '@/lib/url';
import { ACCESS_TOKEN_EXPIRATION } from './token';

type IdTokenOptions = {
  clientId: string,
  requestAuthentication: RequestAuthentication
  userId: string,
  authTime: Date,
  nonce: string,
}
export async function createIdToken({ userId, clientId, requestAuthentication, authTime, nonce }: IdTokenOptions) {
  const { origin: issuer } = await getBaseUrlFromHeaders();

  const issuedAt = Math.floor(Date.now() / 1000);

  const idToken = {
    iss: issuer,
    sub: userId,
    aud: [clientId],
    exp: issuedAt + ACCESS_TOKEN_EXPIRATION,
    iat: issuedAt,
    auth_time: authTime.valueOf(),
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
