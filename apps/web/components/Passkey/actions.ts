'use server';

import 'server-only';
import { getSession, getUser } from '@/lib/session';
import { getBaseUrlFromHeaders } from '@/lib/url';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { getAndDeleteChallengeCookie, setChallengeCookie } from './challenge-cookie';
import { AuthenticationResponseJSON, AuthenticatorTransportFuture, RegistrationResponseJSON } from '@simplewebauthn/types';
import { db } from '@/lib/db';
import { userAgent } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getPreviousUser } from 'app/login/form';
import { Passkey } from '@gw2me/database';
import { revalidatePath } from 'next/cache';
import { LoginErrorCookieName, authCookie, userCookie } from '@/lib/cookie';
import { redirect } from 'next/navigation';

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

  const { rpID, rpName } = getRelayingParty();

  const existingPasskeys = await db.passkey.findMany({
    where: { userId: user.id },
    select: { id: true, transports: true },
  });

  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userName: user.name,
    attestationType: 'none',
    timeout: 60000,
    excludeCredentials: existingPasskeys.map(mapPasskeyToCredentials),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred'
    }
  });

  setChallengeCookie(options);
  console.log(options); // TODO: remove

  return options;
}

export async function getAuthenticationOptions() {
  const { rpID } = getRelayingParty();

  const rememberedUser = await getPreviousUser();
  const passkeys = rememberedUser ? await db.passkey.findMany({
    where: { userId: rememberedUser.id }
  }) : [];


  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: passkeys.map(mapPasskeyToCredentials),
  });

  setChallengeCookie(options);
  console.log(options);

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

  revalidatePath('/providers');
}

export async function submitAuthentication(authentication: AuthenticationResponseJSON, returnTo?: string) {
  const rememberedUser = await getPreviousUser();

  const passkey = await db.passkey.findUnique({
    where: { id: authentication.id, userId: rememberedUser?.id }
  });

  if(!passkey) {
    throw new Error('Unknown passkey id');
  }

  const { rpID, origin } = getRelayingParty();
  const { challenge } = getAndDeleteChallengeCookie();

  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response: authentication,
    authenticator: {
      credentialID: passkey.id,
      credentialPublicKey: passkey.publicKey,
      counter: Number(passkey.counter),
      transports: passkey.transports as AuthenticatorTransportFuture[]
    },
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true
  });

  console.log({ verified, authenticationInfo }); // TODO: remove

  if(!verified) {
    throw new Error('Verification failed');
  }

  await db.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: authenticationInfo.newCounter,
      provider: { update: { usedAt: new Date() }}
    }
  });

  // parse user-agent to set session name
  const { browser, os } = userAgent({ headers: headers() });
  const sessionName = browser && os ? `${browser.name} on ${os.name}` : 'Session';

  // create a new session
  const session = await db.userSession.create({ data: { info: sessionName, userId: passkey.userId }});

  // set session cookie
  cookies().set(authCookie(session.id, true));
  cookies().set(userCookie(passkey.userId));
  cookies().delete(LoginErrorCookieName);

  // redirect
  // TODO: verify returnTo to only redirect to to trusted URLs
  redirect(returnTo ?? '/profile');
}

function mapPasskeyToCredentials({ id, transports }: Pick<Passkey, 'id' | 'transports'>) {
  return {
    id,
    transports: transports as AuthenticatorTransportFuture[]
  };
}
