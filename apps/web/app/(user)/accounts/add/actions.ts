'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { getApiKeyVerificationName } from '@/lib/api-key-verification-name';
import { db } from '@/lib/db';
import { fetchGw2Api } from '@/lib/gw2-api-request';
import { getSessionOrRedirect } from '@/lib/session';
import { redirect } from 'next/navigation';

const apiKeyRegex = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{20}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;

export async function addAccount(returnTo: string | undefined, requireVerification: boolean, _: FormState, payload: FormData): Promise<FormState> {
  const session = await getSessionOrRedirect();

  const apiKey = payload.get('api-key');

  if(apiKey === null || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return { error: 'Missing API key' };
  }

  // verify format
  if(!apiKey.match(apiKeyRegex)) {
    return { error: 'Invalid Format (JWT Subtokens are not supported)' };
  }

  // verify token
  let tokeninfo;
  try {
    tokeninfo = await fetchGw2Api('/v2/tokeninfo', { accessToken: apiKey });
  } catch {
    return { error: 'Could not verify API key' };
  }

  const tokenName = tokeninfo.name.trim();

  const verificationKeyName = await getApiKeyVerificationName();

  const verified = tokenName === verificationKeyName;

  if(requireVerification && !verified) {
    return { error: 'Wrong API key name. Make sure to create a new API key and not rename an already existing API key.' };
  }

  let account;
  try {
    account = await fetchGw2Api('/v2/account', { accessToken: apiKey });
  } catch {
    return { error: 'Could not load account from Guild Wars 2 API.' };
  }

  // check if this exact api key is already known
  const tokenExists = await db.apiToken.count({ where: { id: tokeninfo.id }});
  if(tokenExists > 0) {
    return { error: 'This API key was already added to gw2.me. Please generate a new one.' };
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
        verified: verified || undefined,
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
