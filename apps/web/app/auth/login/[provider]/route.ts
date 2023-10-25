import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { getUrlFromParts, getUrlPartsFromRequest } from '@/lib/urlParts';
import { UserProviderRequestType } from '@gw2me/database';
import { providers } from 'app/auth/providers';
import { createHash, randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params: { provider: providerName }}: { params: { provider: string }}): Promise<never> {
  // get provider
  const provider = providers[providerName];

  // make sure provider exists and is configured
  if(!provider) {
    console.error(`Invalid provider ${provider}`);
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
    path: `/auth/callback/${providerName}`
  });


  // if this is a 'add' request make sure the user is logged in
  let userId: string | undefined;
  if(type === UserProviderRequestType.add) {
    const user = await getUser();
    if(!user) {
      redirect('/login?error');
    }

    userId = user.id;
  }

  // generate state
  const state = randomBytes(16).toString('base64url');

  // genereate PKCE verifier and challenge
  const code_verifier = randomBytes(32).toString('base64url');
  const code_challenge_method = 'S256';
  const code_challenge = createHash('sha256').update(code_verifier).digest('base64url');

  // store auth request in db so we can later verify the state and code challenge and append additional data
  await db.userProviderRequest.create({
    data: {
      provider: provider.id,
      type,
      userId,
      state,
      redirect_uri,
      code_verifier,
    },
    select: { id: true }
  });

  // redirect to provider
  redirect(provider.getAuthUrl({ state, redirect_uri, code_challenge, code_challenge_method }));
}