'use server';

import { FormState } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';

const apiKeyRegex = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{20}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;

export async function addAccount(returnTo: string | undefined, previousState: FormState, payload: FormData): Promise<FormState> {
  const user = await getUser();

  if(!user) {
    redirect('/login');
  }

  const apiKey = payload.get('api-key');

  if(apiKey === null || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return { error: 'Missing API key' };
  }

  // verify format
  if(!apiKey.match(apiKeyRegex)) {
    return { error: 'Invalid Format (JWT Subtokens are not supported)' };
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  // verify token
  const response = await fetch('https://api.guildwars2.com/v2/tokeninfo', { headers });

  if(response.status !== 200) {
    return { error: 'Could not verify API key' };
  }

  const tokeninfo = await response.json();
  const account = await (await fetch('https://api.guildwars2.com/v2/account', { headers })).json();

  // check if api key is already known
  const count = await db.apiToken.count({ where: { id: tokeninfo.id }});
  if(count > 0) {
    return { error: 'API key already added' };
  }

  let accountId: string | undefined;
  try {
    const { id } = await db.account.upsert({
      where: { accountId_userId: { accountId: account.id, userId: user.id }},
      create: {
        accountId: account.id,
        accountName: account.name,
        userId: user.id,
        apiTokens: {
          create: {
            id: tokeninfo.id,
            name: tokeninfo.name,
            token: apiKey,
            permissions: tokeninfo.permissions,
          }
        }
      },
      update: {
        accountName: account.name,
        apiTokens: {
          create: {
            id: tokeninfo.id,
            name: tokeninfo.name,
            token: apiKey,
            permissions: tokeninfo.permissions,
          }
        }
      }
    });

    accountId = id;
  } catch(error) {
    console.error(error);
    return { error: 'Could not save api token' };
  }

  redirect(returnTo ?? `/accounts/${accountId}`);
}
