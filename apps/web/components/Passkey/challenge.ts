import { expiresAt, toTimestamp } from '@/lib/date';
import { createJwt, verifyJwt } from '@/lib/jwt';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';

export function createChallengeJwt(data: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON) {
  const challenge = data.challenge;
  const userId = 'user' in data ? data.user.id : undefined;

  const challengeJwt = createJwt({ sub: userId, challenge, exp: data.timeout ? toTimestamp(expiresAt(data.timeout)) : undefined });

  return challengeJwt;
}

export async function verifyChallengeJwt(challengeJwt: string): Promise<{ webAuthnUserId?: string, challenge: string }> {
  try {
    console.log(challengeJwt);

    const { sub, challenge }: { sub?: string, challenge: string } = await verifyJwt(challengeJwt, { requiredClaims: ['challenge'] });
    return { webAuthnUserId: sub, challenge };
  } catch(e) {
    throw new Error('Passkey challenge invalid', { cause: e });
  }
}
