import { redirect } from 'next/navigation';
import { NextRequest, userAgent } from 'next/server';
import { db } from '@/lib/db';
import { authCookie } from '@/lib/cookie';
import { UserProviderRequestType } from '@gw2me/database';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { providers } from 'app/auth/providers';
import { getSession } from '@/lib/session';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params: { provider: providerName }}: { params: { provider: string }}) {
  // get provider
  const provider = providers[providerName];

  // make sure provider exists and is configured
  if(!provider) {
    console.error(`Invalid provider ${provider}`);
    redirect('/login?error');
  }

  // get state from querystring
  const { state, ...searchParams } = Object.fromEntries(new URL(request.url).searchParams.entries());

  if(!state) {
    redirect('/login?error');
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

    if(!returnUrl) {
      returnUrl = authRequest.type === UserProviderRequestType.add
        ? '/providers'
        : '/profile';
    }

    // get user profile from provider
    const profile = await provider.getUser({ searchParams, authRequest });

    // make sure username only contains valid characters
    profile.username = profile.username.replaceAll(/[^a-z0-9._-]+/gi, '');

    // build provider key
    const providerId = {
      provider: provider.id,
      providerAccountId: profile.accountId
    };

    // if the username already exists in the db we append a random string
    const username = await db.user.findFirst({ where: { name: profile.username }})
      ? `${profile.username}-${randomBytes(4).toString('base64url')}`
      : profile.username;

    // try to find this account in db
    const { userId } = await db.userProvider.upsert({
      where: { provider_providerAccountId: providerId },
      // this is a new user and we have to create the user in the db
      create: {
        ...providerId,
        displayName: profile.accountName,
        token: profile.token,
        user: authRequest.type === UserProviderRequestType.login
          ? { create: { name: username, email: profile.email }}
          : { connect: { id: authRequest.userId! }},
        usedAt: new Date(),
      },
      // if that provider profile is already known we update the displayname (might have changed) and the token
      update: {
        displayName: profile.accountName,
        token: profile.token,
        usedAt: new Date(),
      }
    });

    // get existing session so we can reuse it
    const existingSession = await getSession();

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

    // redirect
    redirect(returnUrl);
  } catch(error) {
    if(isRedirectError(error)) {
      throw error;
    }

    console.error(error);
    redirect(requestType === 'add' ? '/providers?error' : '/login?error');
  }
}
