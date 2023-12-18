'use server';

import { FormState } from '@/components/Form/Form';
import { getApiKeyVerificationName } from '@/lib/api-key-verification-name';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const apiKeyRegex = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{20}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;

export async function addAccount(returnTo: string | undefined, requireVerification: boolean, _: FormState, payload: FormData): Promise<FormState> {
  const session = await getSession();

  if(!session) {
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
  const tokenName = tokeninfo.name.trim();

  const verificationKeyName = await getApiKeyVerificationName();

  const verified = tokenName === verificationKeyName;

  if(requireVerification && !verified) {
    return { error: 'Wrong API key name. Make sure to create a new API key and not rename an already existing API key.' };
  }

  const account = await (await fetch('https://api.guildwars2.com/v2/account', { headers })).json();

  // check if api key is already known for this user
  const tokenExists = await db.apiToken.count({ where: { id: tokeninfo.id }});
  if(tokenExists > 0) {
    return { error: 'This exact API key already exists. Please generate a new one.' };
  }

  // check if account is already verified for a different user
  const tokenBelongsToVerifiedAccount = await db.account.count({
    where: { accountId: account.id, verified: true, userId: { not: session.userId }}
  });
  if(tokenBelongsToVerifiedAccount > 0) {
    return { error: 'The account of this API key is already linked to a different user. Please contact support if you believe this is an error.' };
  }

  // if this account is verified check if there are other users who have this account and delete them
  if(verified) {
    await db.account.deleteMany({
      where: { accountId: account.id, userId: { not: session.userId }},
    });
  }

  let accountId: string | undefined;
  try {
    const { id } = await db.account.upsert({
      where: { accountId_userId: { accountId: account.id, userId: session.userId }},
      create: {
        accountId: account.id,
        accountName: account.name,
        userId: session.userId,
        verified,
        apiTokens: {
          create: {
            id: tokeninfo.id,
            name: tokenName,
            token: apiKey,
            permissions: tokeninfo.permissions,
          }
        }
      },
      update: {
        accountName: account.name,
        verified,
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
