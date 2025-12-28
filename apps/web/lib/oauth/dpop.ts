// import { Algorithm, createVerifier } from 'fast-jwt';
import { createHash } from 'node:crypto';
import { calculateJwkThumbprint, EmbeddedJWK, jwtVerify } from 'jose';
import { OAuth2Error, OAuth2ErrorCode } from './error';

// TODO: add additional algorithms
export const supportedDPoPAlgorithms: string[] = [
  'ES256'
];

// https://datatracker.ietf.org/doc/html/rfc9449#section-4.3
export async function checkProof(proof: string, { htm, htu, accessToken }: { htm: string, htu: URL, accessToken?: string }, expectedJwkThumbprint?: string | '') {
  // verify JWT
  const { protectedHeader, payload } = await jwtVerify(proof, EmbeddedJWK, {
    typ: 'dpop+jwt',
    maxTokenAge: 10,
    requiredClaims: ['jti', 'htm', 'htu', 'iat'],
    algorithms: supportedDPoPAlgorithms
  });

  // ensure request method matches
  if(htm !== payload.htm) {
    console.log('htm mismatch', htm, payload.htm);
    throw new DPoPError(OAuth2ErrorCode.invalid_request, 'htm mismatch');
  }

  // ensure (normalized) request url matches
  if(normalizeHtu(htu) !== normalizeHtu(payload.htu)) {
    console.log('htu mismatch', htu.toString(), payload.htu);
    throw new DPoPError(OAuth2ErrorCode.invalid_request, 'htu mismatch');
  }

  // if this is a proof for a specific access token, ensure the ath claim matches the base64url encoded sha256 hash of the token,
  // otherwise ensure no ath claim is present in the JWT
  if(accessToken) {
    const accessTokenHash = createHash('sha256').update(accessToken).digest('base64url');

    if(accessTokenHash !== payload.ath) {
      throw new DPoPError(OAuth2ErrorCode.invalid_request, 'ath mismatch');
    }
  } else if(payload.ath) {
    throw new DPoPError(OAuth2ErrorCode.invalid_request, 'ath not allowed');
  }

  // calculate jwk thumbprint of provided public key
  const jkt = await calculateJwkThumbprint(protectedHeader['jwk']!, 'sha256');

  // verify calculated jwk thumbprint matches expected
  if(expectedJwkThumbprint && expectedJwkThumbprint !== jkt) {
    throw new DPoPError(OAuth2ErrorCode.invalid_dpop_proof, 'DPoP public key mismatch');
  }

  // return jwk thumbprint
  return {
    jkt
  };
}

class DPoPError extends OAuth2Error {
  constructor(code: OAuth2ErrorCode, description: string) {
    super(code, { description });
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
