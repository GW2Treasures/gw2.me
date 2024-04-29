import { createSigner, createVerifier } from '@/lib/jwt';
import { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { cookies } from 'next/headers';

const cookieName = 'gw2me-passkey-challenge';

export function setChallengeCookie(data: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON): void {
  const challenge = data.challenge;
  const userId = 'user' in data ? data.user.id : undefined;

  const signJwt = createSigner();
  const errorJwt = signJwt({ userId, challenge });

  cookies().set({
    name: cookieName,
    value: errorJwt,

    domain: process.env.BASE_DOMAIN,
    sameSite: 'lax',
    httpOnly: true,
    priority: 'high',
    path: '/',
    secure: true,
    maxAge: 60
  });
}

export function getAndDeleteChallengeCookie(): { webAuthnUserId: string, challenge: string } {
  if(!cookies().has(cookieName)) {
    throw new Error('Passkey challenge cookie missing');
  }

  const jwt = cookies().get(cookieName)!.value;
  cookies().delete('gw2me-passkey-challenge');

  try {
    const { userId, challenge } = createVerifier()(jwt);
    return { webAuthnUserId: userId, challenge };
  } catch(e) {
    throw new Error('Passkey challenge cookie invalid', { cause: e });
  }
}
