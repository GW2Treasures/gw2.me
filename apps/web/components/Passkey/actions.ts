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

function getRelayingParty() {
  const url = getBaseUrlFromHeaders();

  return {
    rpName: 'gw2.me',
    rpID: url.hostname,
    origin: url.origin,
  };
}

export type RegistrationParams =
  | { type: 'add' }
  | { type: 'new', username: string }

export async function getRegistrationOptions(params: RegistrationParams) {
  let user;
  if(params.type === 'add') {
    user = await getUser();

    if(!user) {
      throw new Error('Not logged in');
    }
  };

  const { rpID, rpName } = getRelayingParty();

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
      userVerification: 'preferred'
    }
  });

  console.log(options); // TODO: remove

  return { options, challenge: createChallengeJwt(options) };
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
    timeout: 3 * 60 * 1000, // 3 minutes
  });

  console.log(options);

  return { options, challenge: createChallengeJwt(options) };
}

export async function getAuthenticationOrRegistrationOptions(username: string) {
  // since this is publicly accessible and checks if usernames exist in the db we use a rate limiter
  const ip = headers().get('x-forwarded-for') ?? 'anonymous';

  if(!checkRateLimit(ip)) {
    throw new Error('IP rate limit reached');
  }

  const user = await db.user.findUnique({ where: { name: username.trim() }});

  if(user) {
    const { options, challenge } = await getAuthenticationOptions();
    return { type: 'authentication', options, challenge } as const;
  } else {
    const { options, challenge } = await getRegistrationOptions({ type: 'new', username });
    return { type: 'registration', options, challenge } as const;
  }
}

export async function submitRegistration(params: RegistrationParams & { returnTo?: string }, challengeJwt: string, registration: RegistrationResponseJSON) {
  console.log(registration); // TODO: remove

  const { origin, rpID } = getRelayingParty();
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

  const ua = userAgent({ headers: headers() });
  const displayName = ua.browser && ua.os ? `${ua.browser.name} on ${ua.os.name}` : undefined;

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
        info: displayName ?? 'Session',
        user: { create: { name: params.username }}
      },
      select: { id: true, userId: true }
    });

    cookies().set(authCookie(session.id, true));
    cookies().set(userCookie(session.userId));
    cookies().delete(LoginErrorCookieName);
  }

  const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await db.userProvider.create({
    data: {
      displayName: displayName ?? 'New Passkey',
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

  const { rpID, origin } = getRelayingParty();
  const { challenge } = verifyChallengeJwt(challengeJwt);

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

// map to store ip address - rate limit info
const loginAttempts: Map<string, { count: number; timestamp: number }> = new Map();
const maxAttempts = 5;
const resetTime = 60;

function checkRateLimit(ip: string): boolean {
  // get the current timestamp
  const now = Date.now();

  // check if an entry exists for this IP address
  let entry = loginAttempts.get(ip);

  if (entry) {
    // check if within the reset window based on timestamp difference
    if (now - entry.timestamp < resetTime * 1000) {
      if (entry.count >= maxAttempts) {
        // rate limit exceeded
        return false;
      }
      // increment attempt count
      entry.count++;
    } else {
      // reset count
      entry.count = 1;
      entry.timestamp = now;
    }
  } else {
    // create a new entry for the IP address with initial count and timestamp
    entry = { count: 1, timestamp: now };
    loginAttempts.set(ip, entry);
  }

  // user is not rate limited
  return true;
}
