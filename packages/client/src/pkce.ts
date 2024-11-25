export interface PKCEChallenge {
  code_challenge: string;
  code_challenge_method: 'S256';
}

export interface PKCEPair {
  challenge: PKCEChallenge,
  verifier: string,
}

export async function generatePKCEPair(): Promise<PKCEPair> {
  // generate 32 random bytes
  const verifierBuffer = new Uint8Array(32);
  crypto.getRandomValues(verifierBuffer);

  // encode verifier using base64url
  const verifier = base64urlEncode(verifierBuffer.buffer);

  // hash random bytes using SHA256
  const encoder = new TextEncoder();
  const challenge = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));

  // return base64url encoded PKCE pair
  return {
    verifier,
    challenge: {
      code_challenge_method: 'S256',
      code_challenge: base64urlEncode(challenge)
    }
  };
}

function base64urlEncode(data: ArrayBuffer): string {
  const base64encoded = btoa(String.fromCharCode(...new Uint8Array(data)));

  return base64encoded.replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
