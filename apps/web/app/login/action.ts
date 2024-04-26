'use server';

import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { getBaseUrlFromHeaders } from '@/lib/url';
import { UserProviderRequestType } from '@gw2me/database';
import { providers } from 'app/auth/providers';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { getFormDataString } from '@/lib/form-data';

export interface LoginOptions {
  returnTo?: string;
  userId?: string;
}

export async function login(type: UserProviderRequestType, options: LoginOptions, _prevState: FormState, payload: FormData): Promise<FormState> {
  const provider = getFormDataString(payload, 'provider');

  // get provider config
  const providerConfig = provider && providers[provider];

  // make sure provider exists and is configured
  if(!providerConfig) {
    console.error(`Invalid provider ${provider}`);

    return { error: 'Invalid provider' };
  }

  // build callback url
  const redirect_uri = new URL(
    `/auth/callback/${providerConfig.id}`,
    getBaseUrlFromHeaders()
  ).toString();

  // if this is a 'add' request make sure the user is logged in
  let userId: string | undefined;
  if(type === UserProviderRequestType.add) {
    const session = await getSessionOrRedirect();

    userId = session.userId;
  }

  // generate state
  const state = randomBytes(16).toString('base64url');

  // set return cookie
  // TODO: we could also save this in the db instead of as a cookie
  // TODO: update returnTo to only handle trusted urls (encode it? JWT?)
  if(options.returnTo) {
    cookies().set(`${state}.return`, options.returnTo, { maxAge: 300 });
  }

  // generate PKCE verifier and challenge
  const pkce = providerConfig.supportsPKCE ? generatePKCEParameters() : undefined;

  // store auth request in db so we can later verify the state and code challenge and append additional data
  await db.userProviderRequest.create({
    data: {
      provider: providerConfig.id,
      type,
      userId,
      state,
      redirect_uri,
      code_verifier: pkce?.code_verifier,
    },
    select: { id: true }
  });

  // build auth url for provider
  const authUrl = providerConfig.getAuthUrl({
    state,
    redirect_uri,
    code_challenge: pkce?.code_challenge,
    code_challenge_method: pkce?.code_challenge_method,
    prompt: type === 'add'
  });

  // redirect to provider
  console.log('redirecting to', authUrl);
  redirect(authUrl);
}

function generatePKCEParameters() {
  const code_verifier = randomBytes(32).toString('base64url');
  const code_challenge_method = 'S256';
  const code_challenge = createHash('sha256').update(code_verifier).digest('base64url');

  return { code_verifier, code_challenge_method, code_challenge };
}
