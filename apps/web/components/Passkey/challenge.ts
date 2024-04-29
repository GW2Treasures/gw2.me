import { createSigner, createVerifier } from '@/lib/jwt';
import { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';

export function createChallengeJwt(data: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON) {
  const challenge = data.challenge;
  const userId = 'user' in data ? data.user.id : undefined;

  const signJwt = createSigner();
  const challengeJwt = signJwt({ userId, challenge });

  return challengeJwt;
}

export function verifyChallengeJwt(challengeJwt: string): { webAuthnUserId?: string, challenge: string } {
  try {
    const { userId, challenge } = createVerifier()(challengeJwt);
    return { webAuthnUserId: userId, challenge };
  } catch(e) {
    throw new Error('Passkey challenge invalid', { cause: e });
  }
}
