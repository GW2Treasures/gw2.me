'use server';

import 'server-only';
import { getSession, getUser } from '@/lib/session';
import { getBaseUrlFromHeaders } from '@/lib/url';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { createChallengeJwt, verifyChallengeJwt } from './challenge';
import { AuthenticationResponseJSON, AuthenticatorTransportFuture, RegistrationResponseJSON } from '@simplewebauthn/types';
import { db } from '@/lib/db';
import { userAgent } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getPreviousUser } from 'app/login/form';
import { Passkey } from '@gw2me/database';
import { revalidatePath } from 'next/cache';
import { LoginErrorCookieName, authCookie, userCookie } from '@/lib/cookie';
import { redirect } from 'next/navigation';
import aaguids from 'aaguids';

async function getRelayingParty() {
  const url = await getBaseUrlFromHeaders();

  return {
    rpName: 'gw2.me',
    rpID: url.hostname,
    origin: url.origin,
  };
}

export type RegistrationParams =
  | { type: 'add' }
  | { type: 'new', username: string };

export async function getRegistrationOptions(params: RegistrationParams) {
  let user;
  if(params.type === 'add') {
    user = await getUser();

    if(!user) {
      throw new Error('Not logged in');
    }
  }

  const { rpID, rpName } = await getRelayingParty();

  const existingPasskeys = params.type === 'add' ? await db.passkey.findMany({
    where: { userId: user!.id },
    select: { id: true, transports: true },
  }) : [];

  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userName: params.type === 'add' ? user!.name : params.username,
    attestationType: 'none',
    timeout: 60000,
    excludeCredentials: existingPasskeys.map(mapPasskeyToCredentials),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required'
    },
    extensions: {
      credProps: true
    }
  });

  console.log(options); // TODO: remove

  return { options, challenge: createChallengeJwt(options) };
}

export async function getAuthenticationOptions() {
  const { rpID } = await getRelayingParty();

  const rememberedUser = await getPreviousUser();
  const passkeys = rememberedUser ? await db.passkey.findMany({
    where: { userId: rememberedUser.id }
  }) : [];

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: passkeys.map(mapPasskeyToCredentials),
    timeout: 3 * 60 * 1000, // 3 minutes
  });

  console.log(options);

  return { options, challenge: createChallengeJwt(options) };
}

export async function submitRegistration(params: RegistrationParams & { returnTo?: string }, challengeJwt: string, registration: RegistrationResponseJSON) {
  console.log(registration); // TODO: remove

  const { origin, rpID } = await getRelayingParty();
  const { challenge, webAuthnUserId } = verifyChallengeJwt(challengeJwt);

  const verification = await verifyRegistrationResponse({
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    response: registration
  });

  console.log(verification); // TODO: remove

  if(!verification.verified || !verification.registrationInfo || !webAuthnUserId) {
    throw new Error('Verification failed');
  }

  const ua = userAgent({ headers: await headers() });

  // get the name of the session from the useragent
  const sessionDisplayName = ua.browser && ua.os ? `${ua.browser.name} on ${ua.os.name}` : undefined;

  // get the name of the passkey using either `credProps.authenticatorDisplayName` or the AAGUID
  const passkeyDisplayName = (registration.clientExtensionResults.credProps as { authenticatorDisplayName?: string })?.authenticatorDisplayName
    ?? aaguids[verification.registrationInfo.aaguid];

  let session: { id: string; userId: string; };
  if(params.type === 'add') {
    const currentSession = await getSession();

    if(!currentSession) {
      throw new Error('Not logged in');
    }

    session = currentSession;
  } else {
    const invalidUsernameRegex = /[^a-z0-9._-]/i;
    if(invalidUsernameRegex.test(params.username)) {
      throw new Error('Invalid username');
    }

    // create user and new session
    session = await db.userSession.create({
      data: {
        info: sessionDisplayName ?? 'Session',
        user: { create: { name: params.username }}
      },
      select: { id: true, userId: true }
    });

    const cookieStore = await cookies();
    cookieStore.set(authCookie(session.id));
    cookieStore.set(userCookie(session.userId));
    cookieStore.delete(LoginErrorCookieName);
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await db.userProvider.create({
    data: {
      displayName: passkeyDisplayName ?? sessionDisplayName ?? 'New Passkey',
      provider: 'passkey',
      providerAccountId: credential.id,
      userId: session.userId,
      passkeyId: credential.id,
      passkey: {
        create: {
          webAuthnUserId,
          publicKey: credential.publicKey,
          counter: credential.counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: credential.transports,
          userId: session.userId,
        }
      }
    }
  });

  revalidatePath('/providers');
  // redirect
  // TODO: verify returnTo to only redirect to to trusted URLs
  redirect(params.returnTo ?? (params.type === 'add' ? '/providers' : '/profile'));
}

export async function submitAuthentication(challengeJwt: string, authentication: AuthenticationResponseJSON, returnTo?: string) {
  const rememberedUser = await getPreviousUser();

  const passkey = await db.passkey.findUnique({
    where: { id: authentication.id, userId: rememberedUser?.id }
  });

  if(!passkey) {
    throw new Error('Unknown passkey id');
  }

  const { rpID, origin } = await getRelayingParty();
  const { challenge } = verifyChallengeJwt(challengeJwt);

  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response: authentication,
    credential: {
      id: passkey.id,
      publicKey: passkey.publicKey,
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
  const { browser, os } = userAgent({ headers: await headers() });
  const sessionName = browser && os ? `${browser.name} on ${os.name}` : 'Session';

  // create a new session
  const session = await db.userSession.create({ data: { info: sessionName, userId: passkey.userId }});

  // set session cookie
  const cookieStore = await cookies();
  cookieStore.set(authCookie(session.id));
  cookieStore.set(userCookie(passkey.userId));
  cookieStore.delete(LoginErrorCookieName);

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
