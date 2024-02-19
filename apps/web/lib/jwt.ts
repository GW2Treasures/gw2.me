import 'server-only';
import { createSigner as jwtSigner, createVerifier as jwtVerifier } from 'fast-jwt';

function getKey() {
  const key = process.env.JWT_SECRET;

  if(!key) {
    throw new Error('JWT_SECRET env variable not set');
  }

  return key;
}

export const createSigner = () => jwtSigner({ key: getKey(), iss: 'gw2.me' });
export const createVerifier = () => jwtVerifier({ key: getKey() });
