'use server';

import 'server-only';
import { getSession, getUser } from '@/lib/session';
import { getBaseUrlFromHeaders } from '@/lib/url';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { getAndDeleteChallengeCookie, setChallengeCookie } from './challenge-cookie';
import { RegistrationResponseJSON } from '@simplewebauthn/types';
import { db } from '@/lib/db';
import { userAgent } from 'next/server';
import { headers } from 'next/headers';

function getRelayingParty() {
  const url = getBaseUrlFromHeaders();

  return {
    rpName: 'gw2.me',
    rpID: url.hostname,
    origin: url.origin,
  };
}

export async function getRegistrationOptions() {
  const user = await getUser();

  if(!user) {
    throw new Error('Not logged in');
  }

  const options = await generateRegistrationOptions({
    ...getRelayingParty(),
    userName: user.name,
    attestationType: 'none',
    timeout: 60000,
    excludeCredentials: [], // TODO: add active passkeys
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred'
    }
  });

  setChallengeCookie(options);
  console.log(options); // TODO: remove

  return options;
}

export async function submitRegistration(registration: RegistrationResponseJSON) {
  const session = await getSession();

  if(!session) {
    throw new Error('Not logged in');
  }

  console.log(registration); // TODO: remove

  const { origin, rpID } = getRelayingParty();
  const { challenge, webAuthnUserId } = getAndDeleteChallengeCookie();

  const verification = await verifyRegistrationResponse({
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    response: registration
  });

  console.log(verification); // TODO: remove

  if(!verification.verified || !verification.registrationInfo) {
    throw new Error('Verification failed');
  }

  const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  const ua = userAgent({ headers: headers() });
  const displayName = ua.browser && ua.os ? `${ua.browser.name} on ${ua.os.name}` : 'New Passkey';

  await db.userProvider.create({
    data: {
      displayName,
      provider: 'passkey',
      providerAccountId: credentialID,
      userId: session.userId,
      passkeyId: credentialID,
      passkey: {
        create: {
          webAuthnUserId,
          publicKey: Buffer.from(credentialPublicKey),
          counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: registration.response.transports,
          userId: session.userId,
        }
      }
    }
  });
}

