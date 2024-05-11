import { redirect } from 'next/navigation';
import { NextRequest, userAgent } from 'next/server';
import { db } from '@/lib/db';
import { LoginErrorCookieName, authCookie, loginErrorCookie, userCookie } from '@/lib/cookie';
import { Prisma, UserProviderRequestType } from '@gw2me/database';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { providers } from 'app/auth/providers';
import { getSession } from '@/lib/session';
import { randomBytes } from 'crypto';
import { LoginError } from 'app/login/form';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params: { provider: providerName }}: { params: { provider: string }}) {
  // get provider
  const provider = providers[providerName];

  // make sure provider exists and is configured
  if(!provider) {
    console.error(`Invalid provider ${provider}`);
    cookies().set(loginErrorCookie(LoginError.Unknown));
    redirect('/login');
  }

  // get state from querystring
  const { state, ...searchParams } = Object.fromEntries(new URL(request.url).searchParams.entries());

  if(!state) {
    cookies().set(loginErrorCookie(LoginError.Unknown));
    redirect('/login');
  }

  // handle return url
  let returnUrl: string | undefined;
  if(cookies().has(`${state}.return`)) {
    returnUrl = cookies().get(`${state}.return`)?.value;

    cookies().delete(`${state}.return`);
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
        user = { create: { name: username, email: profile.email }};
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
    const isHttps = new URL(authRequest.redirect_uri).protocol === 'https:';
    cookies().set(authCookie(session.id, isHttps));
    cookies().set(userCookie(userId));
    cookies().delete(LoginErrorCookieName);

    // redirect
    redirect(returnUrl);
  } catch(error) {
    if(isRedirectError(error)) {
      throw error;
    }

    console.error(error);

    // get error code if this was a LoginCallbackError
    const errorCode = error instanceof LoginCallbackError ? error.errorCode : LoginError.Unknown;

    // set error cookie
    cookies().set(loginErrorCookie(errorCode));

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
