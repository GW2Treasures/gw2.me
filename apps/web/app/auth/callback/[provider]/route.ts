import { redirect } from 'next/navigation';
import { NextRequest, NextResponse, userAgent } from 'next/server';
import { db } from '@/lib/db';
import { LoginErrorCookieName, authCookie, loginErrorCookie, userCookie } from '@/lib/cookie';
import { Prisma, UserProviderRequestType } from '@gw2me/database';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { ProviderProfile, providers } from 'app/auth/providers';
import { getSession } from '@/lib/session';
import { randomBytes } from 'crypto';
import { LoginError } from 'app/login/form';
import { sendEmailVerificationMail } from '@/lib/mail/email-verification';
import { RouteProps } from '@/lib/next';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: RouteProps<{ provider: string }>) {
  const { provider: providerName } = await params;
  const cookieStore = await cookies();

  // get provider
  const provider = providers[providerName];

  // make sure provider exists and is configured
  if(!provider) {
    console.error(`Invalid provider ${provider}`);
    cookieStore.set(loginErrorCookie(LoginError.Unknown));
    redirect('/login');
  }

  // get state from querystring
  const { state, ...searchParams } = Object.fromEntries(new URL(request.url).searchParams.entries());

  if(!state) {
    cookieStore.set(loginErrorCookie(LoginError.Unknown));
    redirect('/login');
  }

  // handle return url
  let returnUrl: string | undefined;
  if(cookieStore.has(`${state}.return`)) {
    returnUrl = cookieStore.get(`${state}.return`)?.value;

    cookieStore.delete(`${state}.return`);
  }

  let requestType: UserProviderRequestType | undefined;

  try {
    // get request from db
    const authRequest = await db.userProviderRequest.findUniqueOrThrow({
      where: { state, provider: provider.id }
    });

    requestType = authRequest.type;

    // get user profile from provider
    const profile = await provider.getUser({ searchParams, authRequest });

    // make sure username only contains valid characters
    profile.username = profile.username.replaceAll(/[^a-z0-9._-]+/gi, '');

    // build provider key
    const providerId = {
      provider: provider.id,
      providerAccountId: profile.accountId
    };

    // get existing user provider
    const existingProvider = await db.userProvider.findUnique({
      where: { provider_providerAccountId: providerId }
    });

    // get existing session so we can reuse it
    const existingSession = await getSession();

    let userId;

    if(existingProvider) {
      if(existingSession && existingSession.userId !== existingProvider.userId) {
        // TODO: just login as that user? show modal?
        throw new LoginCallbackError(LoginError.WrongUser, 'Already logged in as a different user (session does not match provider)');
      }

      // check that this is a provider for the user we are expecting (either login as existing user or add)
      if(authRequest.userId && authRequest.userId !== existingProvider.userId) {
        if(authRequest.type === 'add') {
          throw new LoginCallbackError(LoginError.WrongUser, 'Tried to add a provider that is already linked to a different user');
        }

        // TODO: show a modal letting the user choose a user?
        throw new LoginCallbackError(LoginError.WrongUser, 'Tried to login as a different user than expected (existing provider)');
      }

      // update provider
      await db.userProvider.update({
        where: { provider_providerAccountId: providerId },
        data: {
          displayName: profile.accountName,
          token: profile.token,
          usedAt: new Date(),
        }
      });

      // update emails in db
      handleEmail(existingProvider.userId, profile);

      userId = existingProvider.userId;
    } else {
      // this is a new provider

      // check if we are trying to login as a specific user
      if(authRequest.type === 'login' && authRequest.userId) {
        throw new LoginCallbackError(LoginError.WrongUser, 'Tried to login as a specific user with an unknown provider');
      }

      let user: Prisma.UserCreateNestedOneWithoutProvidersInput;

      // this is a new signup
      if(authRequest.type === 'login') {
        // if the username already exists in the db we append a random string
        const username = await db.user.findFirst({ where: { name: profile.username }})
          ? `${profile.username}-${randomBytes(4).toString('base64url')}`
          : profile.username;

        // create a new user when creating the provider in the db
        user = { create: { name: username }};
      } else {
        // this is a user adding a new login provider
        user = { connect: { id: authRequest.userId! }};
      }

      // try to find this account in db
      const { userId: newUserId } = await db.userProvider.create({
        data: {
          ...providerId,
          displayName: profile.accountName,
          token: profile.token,
          user,
        },
      });

      // update emails in db
      await handleEmail(newUserId, profile);

      userId = newUserId;
    }

    if(!returnUrl) {
      returnUrl = authRequest.type === UserProviderRequestType.add
        ? '/providers'
        : '/profile';
    }

    // handle existing session
    if(existingSession) {
      if(existingSession.id === userId) {
        // the existing session was for the same user and we can reuse it
        redirect(returnUrl);
      } else {
        // just logged in with a different user - lets delete the old session
        await db.userSession.delete({ where: { id: existingSession.id }});
      }
    }

    // parse user-agent to set session name
    const { browser, os } = userAgent(request);
    const sessionName = browser && os ? `${browser.name} on ${os.name}` : 'Session';

    // create a new session
    const session = await db.userSession.create({ data: { info: sessionName, userId }});

    // set session cookie
    cookieStore.set(authCookie(session.id));
    cookieStore.set(userCookie(userId));
    cookieStore.delete(LoginErrorCookieName);

    // redirect
    return NextResponse.redirect(
      new URL(returnUrl, authRequest.redirect_uri),
      { headers: { 'Set-Login': 'logged-in' }}
    );
  } catch(error) {
    if(isRedirectError(error)) {
      throw error;
    }

    console.error(error);

    // get error code if this was a LoginCallbackError
    const errorCode = error instanceof LoginCallbackError ? error.errorCode : LoginError.Unknown;

    // set error cookie
    cookieStore.set(loginErrorCookie(errorCode));

    // redirect to return URL
    const redirectTo = returnUrl ?? (requestType === 'add' ? '/providers' : '/login');
    console.log('redirecting to', redirectTo);

    redirect(redirectTo);
  }
}

class LoginCallbackError extends Error {
  constructor(public errorCode: LoginError, message: string) {
    super(message);
  }
}

async function handleEmail(userId: string, profile: ProviderProfile) {
  // if this provider does not provide an email, we don't have to do anything...
  if(!profile.email) {
    return;
  }

  // get count of emails for this user
  // if the user does not have any emails yet, we set this email as default
  const emailCount = await db.userEmail.count({ where: { userId }});

  // get or create email
  const email = await db.userEmail.upsert({
    where: { userId_email: { userId, email: profile.email }},
    create: {
      email: profile.email,
      userId,
      verified: profile.emailVerified,
      verifiedAt: profile.emailVerified ? new Date() : undefined,
      isDefaultForUserId: emailCount === 0 ? userId : undefined,
    },
    update: profile.emailVerified
      ? { verified: true, verifiedAt: new Date() }
      : {}
  });

  // send verification email if email is not verified and no verification mail was sent yet
  if(!email.verified && email.verificationToken === null) {
    // TODO: use next/after once gw2.me uses Next.js 15
    await sendEmailVerificationMail(email.id);
  }
}
