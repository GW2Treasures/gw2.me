'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { createAction } from '@/lib/actions';
import { getFormDataString } from '@/lib/form-data';
import { SharedAccountState } from '@gw2me/database';

export async function updateDisplayName(id: string, state: FormState, formData: FormData): Promise<FormState> {
  const displayName = formData.get('displayName');

  if(typeof displayName !== 'string') {
    return { error: 'Invalid displayName' };
  }

  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  await db.account.updateMany({
    where: { id, userId: session.userId },
    data: { displayName: displayName.trim() || null }
  });

  revalidatePath(`/accounts/${id}`);

  return { success: 'Custom Name updated' };
}

export const deleteApiKey = createAction(async function deleteApiKey(_, formData) {
  const id = formData.get('apiKeyId');

  if(typeof id !== 'string') {
    return { error: 'Invalid id' };
  }

  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  try {
    await db.apiToken.delete({ where: { id, account: { userId: session.userId }}});
  } catch {
    return { error: 'Error deleting key' };
  }

  revalidatePath(`/accounts/${id}`);

  return { success: 'API Key deleted' };
});


export const shareAccount = createAction(async function shareAccount(_, formData) {
  const accountId = getFormDataString(formData, 'accountId');
  const username = getFormDataString(formData, 'username');

  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  // find account
  const account = await db.account.findUnique({
    where: { id: accountId, userId: session.userId },
    select: { id: true, shares: { select: { userId: true }}}
  });

  if(!account) {
    return { error: 'Account not found' };
  }

  // find user
  const user = await db.user.findUnique({
    where: { name: username, NOT: { id: session.id }}
  });

  if(!user) {
    return { error: 'User not found' };
  }

  // make sure this account is not already shared with the user
  // this is just for a nicer error message, its also enforced by a unique constraint in the db
  if(account.shares.some(({ userId }) => userId === user.id)) {
    return { error: `You have already shared this account with ${user.name}.` };
  }

  // share account
  await db.sharedAccount.create({
    data: {
      accountId: account.id,
      userId: user.id,

      state: SharedAccountState.Pending,
    }
  });

  // TODO: send email to notify user

  revalidatePath(`/accounts/${account.id}`);
  return { success: `${user.name} received an invitation to use your shared account.` };
});
