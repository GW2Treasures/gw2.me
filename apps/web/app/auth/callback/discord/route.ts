import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import parseUserAgent from 'ua-parser-js';
import { authCookie } from '@/lib/cookie';
import { getUrlFromParts, getUrlPartsFromRequest } from '@/lib/urlParts';

export const dynamic = 'force-dynamic';

const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  if(!clientId || !clientSecret) {
    console.error('DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not set');
    redirect('/login?error');
  }

  try {
    // get code from querystring
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if(!code) {
      redirect('/login?error');
    }

    // build callback url
    const parts = getUrlPartsFromRequest(request);
    const callbackUrl = getUrlFromParts({
      ...parts,
      path: '/auth/callback/discord'
    });

    // build token request
    const data = new URLSearchParams({
      // eslint-disable-next-line object-shorthand
      'code': code,
      'client_id': clientId,
      'client_secret': clientSecret,
      'grant_type': 'authorization_code',
      'redirect_uri': callbackUrl,
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
    const provider = { provider: 'discord', providerAccountId: profile.id };

    const displayName = profile.discriminator === '0' ? profile.username : `${profile.username}#${profile.discriminator.padStart(4, '0')}`;

    // try to find this account in db
    const { userId } = await db.userProvider.upsert({
      where: { provider_providerAccountId: provider },
      create: {
        ...provider,
        displayName,
        token,
        user: { create: { name: profile.username, email: profile.email }}
      },
      update: { displayName, token }
    });

    // parse user-agent to set session name
    const userAgentString = request.headers.get('user-agent');
    const userAgent = userAgentString ? parseUserAgent(userAgentString) : undefined;
    const sessionName = userAgent ? `${userAgent.browser.name} on ${userAgent.os.name}` : 'Session';

    // create a new session
    const session = await db.userSession.create({ data: { info: sessionName, userId }});

    // send response with session cookie
    const profileUrl = getUrlFromParts({ ...parts, path: '/login/return' });
    const response = NextResponse.redirect(profileUrl);
    response.cookies.set(authCookie(session.id, parts.protocol === 'https:'));
    return response;
  } catch(error) {
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
