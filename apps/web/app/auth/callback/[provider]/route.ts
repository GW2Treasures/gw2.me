import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import parseUserAgent from 'ua-parser-js';
import { authCookie } from '@/lib/cookie';
import { getUser } from '@/lib/getUser';
import { UserProviderRequestType } from '@gw2me/database';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { providers } from 'app/auth/providers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params: { provider: providerName }}: { params: { provider: string }}) {
  // get provider
  const provider = providers[providerName];

  // make sure provider exists and is configured
  if(!provider) {
    console.error(`Invalid provider ${provider}`);
    redirect('/login?error');
  }

  // get code from querystring
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // code and state are required
  if(!code || !state) {
    redirect('/login?error');
  }

  try {
    // get request from db
    const authRequest = await db.userProviderRequest.findUniqueOrThrow({
      where: { state, provider: provider.id }
    });

    const profile = await provider.getUser({ code, authRequest });

    // build provider key
    const providerId = {
      provider: provider.id,
      providerAccountId: profile.accountId
    };

    // try to find this account in db
    const { userId } = await db.userProvider.upsert({
      where: { provider_providerAccountId: providerId },
      // this is a new user and we have to create the user in the db
      create: {
        ...providerId,
        displayName: profile.accountName,
        token: profile.token,
        user: authRequest.type === UserProviderRequestType.login
          ? { create: { name: profile.username, email: profile.email }}
          : { connect: { id: authRequest.userId! }}
      },
      // if that provider profile is already known we update the displayname (might have changed) and the token
      update: {
        displayName: profile.accountName,
        token: profile.token
      }
    });

    // get existing session so we can reuse it
    const existingSession = await getUser();

    if(existingSession) {
      if(existingSession.id === userId) {
        // the existing session was for the same user and we can reuse it
        redirect('/profile');
      } else {
        // just logged in with a different user - lets delete the old session
        await db.userSession.delete({ where: { id: existingSession.sessionId }});
      }
    }

    // parse user-agent to set session name
    const userAgentString = request.headers.get('user-agent');
    const userAgent = userAgentString ? parseUserAgent(userAgentString) : undefined;
    const sessionName = userAgent ? `${userAgent.browser.name} on ${userAgent.os.name}` : 'Session';

    // create a new session
    const session = await db.userSession.create({ data: { info: sessionName, userId }});

    // set session cookie
    const isHttps = new URL(authRequest.redirect_uri).protocol === 'https:';
    cookies().set(authCookie(session.id, isHttps));

    // redirect
    redirect('/login/return');
  } catch(error) {
    if(isRedirectError(error)) {
      throw error;
    }

    console.error(error);
    redirect('/login?error');
  }
}
