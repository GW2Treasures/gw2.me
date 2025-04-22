import { base64urlEncode } from './base64';
import type { DPoPParams } from './types';

export function generateDPoPKeyPair() {
  return crypto.subtle.generateKey({
    name: 'ECDSA',
    namedCurve: 'P-256',
  }, false, ['sign']);
}

export async function createDPoPJwt({ htm, htu, nonce, accessToken }: DPoPParams, keyPair: CryptoKeyPair) {
  // TODO: support user algorithms based on used key
  const header = JSON.stringify({
    alg: 'ES256',
    typ: 'dpop+jwt',
    jwk: await jwk(keyPair.publicKey)
  });
  const body = JSON.stringify({
    iat: Math.floor(Date.now() / 1000),
    jti: base64urlEncode(crypto.getRandomValues(new Uint8Array(32))),
    htm, htu, nonce,
    ath: accessToken
      ? base64urlEncode(await crypto.subtle.digest('SHA-256', stringToBuffer(accessToken)))
      : undefined,
  });

  const input = `${base64urlEncode(stringToBuffer(header))}.${base64urlEncode(stringToBuffer(body))}`;

  const signatureAlgorithm: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };
  const signature = base64urlEncode(await crypto.subtle.sign(signatureAlgorithm, keyPair.privateKey, stringToBuffer(input)));

  return `${input}.${signature}`;
}

const encoder = new TextEncoder();

function stringToBuffer(value: string): Uint8Array {
  return encoder.encode(value);
}

async function jwk(key: CryptoKey) {
  const { kty, e, k, n, x, y, crv } = await crypto.subtle.exportKey('jwk', key);

  // return relevant properties in the order expected to calculate the thumbprint
  return { e, k, crv, kty, n, x, y };
}

export async function jwkThumbprint(key: CryptoKey) {
  const jwkJson = JSON.stringify(await jwk(key));
  const hash = await crypto.subtle.digest('SHA-256', stringToBuffer(jwkJson));

  return base64urlEncode(hash);
}
