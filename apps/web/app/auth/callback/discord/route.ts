import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import parseUserAgent from 'ua-parser-js';
import { authCookie } from '@/lib/cookie';
import { getUser } from '@/lib/getUser';
import { UserProviderRequestType, UserProviderType } from '@gw2me/database';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect';

export const dynamic = 'force-dynamic';

const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  if(!clientId || !clientSecret) {
    console.error('DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not set');
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
      where: { state }
    });

    // build token request
    const data = new URLSearchParams({
      // eslint-disable-next-line object-shorthand
      'code': code,
      'client_id': clientId,
      'client_secret': clientSecret,
      'grant_type': 'authorization_code',
      'redirect_uri': authRequest.redirect_uri,
      'code_verifier': authRequest.code_verifier!,
    });

    // get discord token
    const token = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data,
    }).then(getJsonIfOk) as { access_token: string };

    // get profile info with token
    const profile = await fetch('https://discord.com/api/users/@me', {
      headers: { 'Authorization': `Bearer ${token.access_token}` }
    }).then(getJsonIfOk) as { id: string, username: string, email: string, discriminator: string };

    // build provider key
    const provider = { provider: UserProviderType.discord, providerAccountId: profile.id };

    // get discord user name (darthmaim or legacy darthmaim#1234)
    const displayName = profile.discriminator !== '0'
      ? `${profile.username}#${profile.discriminator.padStart(4, '0')}`
      : profile.username;

    // try to find this account in db
    const { userId } = await db.userProvider.upsert({
      where: { provider_providerAccountId: provider },
      create: {
        ...provider,
        displayName,
        token,
        user: authRequest.type === UserProviderRequestType.login
          ? { create: { name: profile.username, email: profile.email }}
          : { connect: { id: authRequest.userId! }}
      },
      update: { displayName, token }
    });

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

function getJsonIfOk(response: Response) {
  if(!response.ok) {
    throw new Error('Could not load discord profile');
  }

  return response.json();
}
