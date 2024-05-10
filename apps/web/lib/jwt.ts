import 'server-only';
import { SignerOptions, createSigner as jwtSigner, createVerifier as jwtVerifier } from 'fast-jwt';

function getKey() {
  const key = process.env.JWT_SECRET;

  if(!key) {
    throw new Error('JWT_SECRET env variable not set');
  }

  return key;
}

export const createSigner = (options: Partial<SignerOptions> = {}) => jwtSigner({ key: getKey(), iss: 'gw2.me', ...options });
export const createVerifier = () => jwtVerifier({ key: getKey() });
