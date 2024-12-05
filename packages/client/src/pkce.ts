export interface PKCEChallenge {
  code_challenge: string;
  code_challenge_method: 'S256';
}

export interface PKCEPair {
  challenge: PKCEChallenge,
  code_verifier: string,
}

export async function generatePKCEPair(): Promise<PKCEPair> {
  // generate 32 random bytes
  const verifierBuffer = new Uint8Array(32);
  crypto.getRandomValues(verifierBuffer);

  // encode verifier using base64url
  const code_verifier = base64urlEncode(verifierBuffer);

  // hash random bytes using SHA256
  const encoder = new TextEncoder();
  const challenge = await crypto.subtle.digest('SHA-256', encoder.encode(code_verifier));

  // return base64url encoded PKCE pair
  return {
    code_verifier,
    challenge: {
      code_challenge_method: 'S256',
      code_challenge: base64urlEncode(new Uint8Array(challenge))
    }
  };
}

function base64urlEncode(data: Uint8Array) {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
