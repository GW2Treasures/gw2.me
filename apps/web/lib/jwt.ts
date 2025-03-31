import 'server-only';
import { JWTPayload, jwtVerify, JWTVerifyOptions, SignJWT } from 'jose';

let key: Uint8Array;

function getKey() {
  // if key is already loaded, return it
  if(key) {
    return key;
  }

  // ensure JWT_SECRET env variable is set
  if(!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET env variable not set');
  }

  // read as UInt8Array and store in `key`
  key = new TextEncoder().encode(process.env.JWT_SECRET);

  // return the key
  return key;
}

export function createJwt(payload: JWTPayload) {
  const signer = new SignJWT(payload);
  signer.setProtectedHeader({ alg: 'HS256' });
  signer.setIssuer('gw2.me');
  signer.setIssuedAt();
  return signer.sign(getKey());
}

export async function verifyJwt<Payload = JWTPayload>(jwt: string, options?: JWTVerifyOptions) {
  const verified = await jwtVerify<Payload>(jwt, getKey(), { issuer: 'gw2.me', ...options });
  return verified.payload;
}
