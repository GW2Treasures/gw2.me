// import { Algorithm, createVerifier } from 'fast-jwt';
import { createHash } from 'crypto';
import { calculateJwkThumbprint, EmbeddedJWK, jwtVerify } from 'jose';
import { OAuth2Error, OAuth2ErrorCode } from './error';

// TODO: add additional algorithms
export const supportedDPoPAlgorithms: string[] = [
  'ES256'
];

export async function checkProof(proof: string, { htm, htu, accessToken }: { htm: string, htu: URL, accessToken?: string }) {
  const { protectedHeader, payload } = await jwtVerify(proof, EmbeddedJWK, {
    typ: 'dpop+jwt',
    maxTokenAge: 10,
    requiredClaims: ['jti', 'htm', 'htu', 'iat'],
  });

  if(htm !== payload.htm) {
    throw new DPoPError('htm mismatch');
  }

  if(normalizeHtu(htu) !== normalizeHtu(payload.htu)) {
    throw new DPoPError('htu mismatch');
  }

  if(accessToken) {
    const accessTokenHash = createHash('sha256').update(accessToken).digest('base64url');
    if(accessTokenHash !== payload.ath) {
      throw new DPoPError('ath mismatch');
    }
  } else if(payload.ath) {
    throw new DPoPError('ath not allowed');
  }

  const jkt = await calculateJwkThumbprint(protectedHeader['jwk']!, 'sha256');

  return {
    jkt
  };
}

class DPoPError extends OAuth2Error {
  constructor(description: string) {
    super(OAuth2ErrorCode.invalid_request, { description });
    Object.setPrototypeOf(this, DPoPError.prototype);
  }
}

function normalizeHtu(htu: unknown): string | null {
  if(!htu) {
    return null;
  }

  try {
    const url = new URL(String(htu));
    url.hash = '';
    url.search = '';
    return url.href;
  } catch {
    return null;
  }
}
