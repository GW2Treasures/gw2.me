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
  const user = await getUser();

  if(!applicationId || !redirect_uri) {
    return { error: 'Invalid request' };
  }

  if(!user) {
    return { error: 'Not logged in' };
  }

  const type = AuthorizationType.Code;
  const userId = user.id;

  const accountIds = formData.getAll('accounts').filter(isString).map((id) => ({ id }));

  if(hasGW2Scopes(scopes) && accountIds.length === 0) {
    return { error: 'At least one account has to be selected.' };
  }

  let authorization: Authorization;

  try {
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
        expiresAt: expiresAt(60),
      }
    });
  } catch {
    return { error: 'Authorization failed' };
  }

  const url = new URL(redirect_uri);
  url.searchParams.set('code', authorization.token);
  state && url.searchParams.set('state', state);

  redirect(url.toString());
};
