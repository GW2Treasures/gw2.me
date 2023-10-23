import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { getUrlFromParts, getUrlPartsFromRequest } from '@/lib/urlParts';
import { UserProviderRequestType, UserProviderType } from '@gw2me/database';
import { createHash, randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const clientId = process.env.DISCORD_CLIENT_ID;

export async function POST(request: NextRequest): Promise<never> {
  if(!clientId) {
    console.error('DISCORD_CLIENT_ID not set');
    redirect('/login?error');
  }

  // get formdata
  const formData = await request.formData();

  // get auth type (login or adding additional provider)
  const type = formData.get('type') === 'add'
    ? UserProviderRequestType.add
    : UserProviderRequestType.login;

  // build callback url
  const redirect_uri = getUrlFromParts({
    ...getUrlPartsFromRequest(request),
    path: '/auth/callback/discord'
  });

  let userId: string | undefined;

  if(type === UserProviderRequestType.add) {
    const user = await getUser();
    if(!user) {
      redirect('/login?error');
    }

    userId = user.id;
  }

  const state = randomBytes(16).toString('base64url');
  const code_verifier = randomBytes(32).toString('base64url');
  const code_challenge = createHash('sha256').update(code_verifier).digest('base64url');

  await db.userProviderRequest.create({
    data: {
      provider: UserProviderType.discord,
      type,
      userId,
      state,
      redirect_uri,
      code_verifier,
    },
    select: { id: true }
  });

  // build discord url
  const searchParams = new URLSearchParams({
    'client_id': clientId,
    'scope': 'identify email',
    'response_type': 'code',
    'prompt': 'none',
    code_challenge,
    code_challenge_method: 'S256',
    redirect_uri,
    state,
  });

  // redirect to discord
  redirect(`https://discord.com/oauth2/authorize?${searchParams.toString()}`);
}
