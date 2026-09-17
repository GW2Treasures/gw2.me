'use server';

import 'server-only';
import { getSession, getUser } from '@/lib/session';
import { getBaseUrlFromHeaders } from '@/lib/url';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON
} from '@simplewebauthn/server';
import { generateUserID, isoBase64URL } from '@simplewebauthn/server/helpers';
import { createChallengeJwt, verifyChallengeJwt } from './challenge';
import { db } from '@/lib/db';
import { userAgent } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getPreviousUser } from '@/app/login/form';
import { Passkey, UserProviderType } from '@gw2me/database';
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

export async function getRegistrationOptions(params: RegistrationParams): Promise<{ options: PublicKeyCredentialCreationOptionsJSON, challenge: string }> {
  const user = params.type === 'add'
    ? await getCurrentUserForRegistration()
    : { name: params.username, webAuthnUserId: await generateUserID() };

  const { rpID, rpName } = await getRelayingParty();

  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userName: user.name,
    userID: user.webAuthnUserId,
    attestationType: 'none',
    timeout: 60000,
    excludeCredentials: user.existingPasskeys,
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required'
    },
    extensions: {
      credProps: true
    }
  });

  return { options, challenge: await createChallengeJwt(options) };
}

export async function getAuthenticationOptions(): Promise<{ options: PublicKeyCredentialRequestOptionsJSON, challenge: string }> {
  const { rpID } = await getRelayingParty();

  // if we know which user is trying to authenticate, we can limit the allowed credentials to their passkeys
  const rememberedUser = await getPreviousUser();
  const passkeys = rememberedUser
    ? await db.passkey.findMany({
        where: { userId: rememberedUser.id },
        select: { id: true, transports: true },
      })
    : undefined;

  // generate authentication options
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: passkeys?.map(mapPasskeyToCredentials),
    timeout: 3 * 60 * 1000, // 3 minutes
  });

  return { options, challenge: await createChallengeJwt(options) };
}

export async function submitRegistration(params: RegistrationParams & { returnTo?: string }, challengeJwt: string, registration: RegistrationResponseJSON) {
  console.log(registration); // TODO: remove

  const { origin, rpID } = await getRelayingParty();
  const { challenge, webAuthnUserId } = await verifyChallengeJwt(challengeJwt);

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

  let session: { id: string, userId: string };
  if(params.type === 'add') {
    const currentSession = await getSession();

    if(!currentSession) {
      throw new Error('Not logged in');
    }

    const user = await db.user.findUniqueOrThrow({
      where: { id: currentSession.userId },
      select: { webAuthnUserId: true }
    });

    if (user.webAuthnUserId !== webAuthnUserId) {
      throw new Error('Internal Server Error', { cause: 'WebAuthn user ID mismatch' });
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
        user: { create: { name: params.username, webAuthnUserId }},
      },
      select: { id: true, userId: true }
    });

    const cookieStore = await cookies();
    cookieStore.set(authCookie(session.id));
    cookieStore.set(await userCookie(session.userId));
    cookieStore.delete(LoginErrorCookieName);
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await db.userProvider.create({
    data: {
      displayName: passkeyDisplayName ?? sessionDisplayName ?? 'New Passkey',
      provider: 'passkey',
      providerAccountId: credential.id,
      userId: session.userId,
      usedAt: new Date(),
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
      },
      // if this is a new user, connect the created session to the provider
      sessions: params.type === 'new' ? { connect: { id: session.id }} : undefined
    }
  });

  revalidatePath('/providers');
  // redirect
  // TODO: verify returnTo to only redirect to to trusted URLs
  redirect(params.returnTo ?? (params.type === 'add' ? '/providers' : '/profile'));
}

export type SubmitAuthenticationResult =
  | { success: true, acceptedCredentials: AllAcceptedCredentialsOptions, currentUserDetails: CurrentUserDetailsOptions }
  | { success: false, reason: 'unknown-credential', unknownCredential: UnknownCredentialOptions }
  | { success: false, reason: 'verification-failed' };

export async function submitAuthentication(challengeJwt: string, authentication: AuthenticationResponseJSON): Promise<SubmitAuthenticationResult> {
  const { rpID, origin } = await getRelayingParty();
  const rememberedUser = await getPreviousUser();

  // get the used passkey from db
  const passkey = await db.passkey.findUnique({
    where: { id: authentication.id, userId: rememberedUser?.id },
    include: { user: { select: { name: true, webAuthnUserId: true }}}
  });

  if(!passkey) {
    return {
      success: false,
      reason: 'unknown-credential',
      unknownCredential: {
        credentialId: authentication.id,
        rpId: rpID,
      }
    };
  }

  // verify authentication response
  const { challenge } = await verifyChallengeJwt(challengeJwt);
  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response: authentication,
    credential: {
      id: passkey.id,
      publicKey: passkey.publicKey,
      counter: Number(passkey.counter),
      transports: passkey.transports
    },
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true
  });

  if(!verified) {
    return {
      success: false,
      reason: 'verification-failed'
    };
  }

  // update counter and last used date for passkey
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
  const session = await db.userSession.create({
    data: {
      info: sessionName,
      userId: passkey.userId,
      providerType: UserProviderType.passkey,
      providerAccountId: passkey.id,
    },
  });

  // set session cookie
  const cookieStore = await cookies();
  cookieStore.set(authCookie(session.id));
  cookieStore.set(await userCookie(passkey.userId));
  cookieStore.delete(LoginErrorCookieName);

  // load all passkeys to signal known credentials to the browser
  const passkeys = await db.passkey.findMany({
    where: { userId: passkey.userId },
    select: { id: true }
  });

  return {
    success: true,
    acceptedCredentials: {
      userId: passkey.user.webAuthnUserId!,
      rpId: rpID,
      allAcceptedCredentialIds: passkeys.map(({ id }) => id)
    },
    currentUserDetails: {
      userId: passkey.user.webAuthnUserId!,
      rpId: rpID,
      displayName: '',
      name: passkey.user.name,
    }
  };
}

function mapPasskeyToCredentials({ id, transports }: Pick<Passkey, 'id' | 'transports'>) {
  return {
    id,
    transports,
  };
}


type UserForRegistration = {
  name: string,
  webAuthnUserId: Uint8Array<ArrayBuffer>,
  existingPasskeys?: Pick<Passkey, 'id' | 'transports'>[],
};

async function getCurrentUserForRegistration(): Promise<UserForRegistration> {
  const currentUser = await getUser();
  if(!currentUser) {
    throw new Error('Not logged in');
  }

  // get existing passkeys to exclude them from registration
  const existingPasskeys = await db.passkey.findMany({
    where: { userId: currentUser.id },
    select: { id: true, transports: true },
  });

  // get webAuthnUserId or generate a new one
  const webAuthnUserId = currentUser.webAuthnUserId
    ? isoBase64URL.toBuffer(currentUser.webAuthnUserId)
    : await generateUserID();

  // update user in db if webAuthnUserId is not set
  if (!currentUser.webAuthnUserId) {
    await db.user.update({
      where: { id: currentUser.id },
      data: { webAuthnUserId: isoBase64URL.fromBuffer(webAuthnUserId) }
    });
  }

  return { name: currentUser.name, webAuthnUserId, existingPasskeys };
}
