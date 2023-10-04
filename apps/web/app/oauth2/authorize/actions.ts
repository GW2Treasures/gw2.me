'use server';

import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { isString } from '@/lib/is';
import { generateCode } from '@/lib/token';
import { Authorization, AuthorizationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { hasGW2Scopes } from './validate';
import { Scope } from '@gw2me/api';
import { FormState } from '@/components/Form/Form';

export async function authorize({ applicationId, redirect_uri, scopes, state }: { applicationId: string, redirect_uri: string, scopes: Scope[], state?: string }, previousState: FormState, formData: FormData): Promise<FormState> {
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
    const type = AuthorizationType.Code;
    const userId = user.id;

    // create code authorization in db
    authorization = await db.authorization.upsert({
      where: { type_applicationId_userId: { type, applicationId, userId }},
      create: {
        type, applicationId, userId, scope: scopes,
        accounts: { connect: accountIds },
        token: generateCode(),
        expiresAt: expiresAt(60),
      },
      update: {
        accounts: { set: accountIds },
        scope: scopes,
        expiresAt: expiresAt(60),
      }
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
