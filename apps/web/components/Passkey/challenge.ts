import { createSigner, createVerifier } from '@/lib/jwt';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';

export function createChallengeJwt(data: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON) {
  const challenge = data.challenge;
  const userId = 'user' in data ? data.user.id : undefined;

  const signJwt = createSigner({ expiresIn: data.timeout });
  const challengeJwt = signJwt({ sub: userId, challenge });

  return challengeJwt;
}

export function verifyChallengeJwt(challengeJwt: string): { webAuthnUserId?: string, challenge: string } {
  try {
    const { sub, challenge } = createVerifier()(challengeJwt);
    return { webAuthnUserId: sub, challenge };
  } catch(e) {
    throw new Error('Passkey challenge invalid', { cause: e });
  }
}
