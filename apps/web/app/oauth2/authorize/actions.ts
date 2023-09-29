'use server';

import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { generateCode } from '@/lib/token';
import { AuthorizationType } from '@gw2me/database';
import { redirect } from 'next/navigation';

export async function authorize({ applicationId, redirect_uri, scopes, state }: { applicationId: string, redirect_uri: string, scopes: string[], state?: string }) {
  const user = await getUser();

  if(!applicationId || !redirect_uri || !user) {
    throw new Error();
  }

  const type = AuthorizationType.Code;
  const userId = user.id;

  const authorization = await db.authorization.upsert({
    where: { type_applicationId_userId: { type, applicationId, userId }},
    create: {
      type, applicationId, userId, scope: scopes,
      token: generateCode(),
      expiresAt: expiresAt(60),
    },
    update: {
      expiresAt: expiresAt(60),
    }
  });

  const url = new URL(redirect_uri);
  url.searchParams.set('code', authorization.token);
  state && url.searchParams.set('state', state);

  redirect(url.toString());
};
