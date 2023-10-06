'use server';

import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { isString } from '@/lib/is';
import { generateCode } from '@/lib/token';
import { Authorization, AuthorizationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { hasGW2Scopes } from './validate';
import { Scope } from '@gw2me/client';
import { FormState } from '@/components/Form/Form';

export async function authorize({ applicationId, redirect_uri, scopes, state, codeChallenge }: { applicationId: string, redirect_uri: string, scopes: Scope[], state?: string, codeChallenge?: string }, previousState: FormState, formData: FormData): Promise<FormState> {
  // verify request
  if(!applicationId || !redirect_uri || !scopes) {
    return { error: 'Invalid request' };
  }

  // get session and verify
  const user = await getUser();

  if(!user) {
    return { error: 'Not logged in' };
  }

  // get account ids from form
  const accountIds = formData.getAll('accounts').filter(isString).map((id) => ({ id }));

  // verify at least one account was selected
  if(hasGW2Scopes(scopes) && accountIds.length === 0) {
    return { error: 'At least one account has to be selected.' };
  }

  let authorization: Authorization;

  try {
    const identifier = {
      type: AuthorizationType.Code,
      applicationId,
      userId: user.id
    };

    // delete old pending authorization codes for this app
    await db.authorization.delete({ where: { type_applicationId_userId: identifier }});

    // create code authorization in db
    authorization = await db.authorization.create({
      data: {
        ...identifier,
        scope: scopes,
        redirectUri: redirect_uri,
        codeChallenge,
        token: generateCode(),
        expiresAt: expiresAt(60),
        accounts: { connect: accountIds },
      },
    });
  } catch {
    return { error: 'Authorization failed' };
  }

  // build redirect url with token and state
  const url = new URL(redirect_uri);
  url.searchParams.set('code', authorization.token);
  state && url.searchParams.set('state', state);

  // redirect back to app
  redirect(url.toString());
};
