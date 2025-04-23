'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession, getUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { createAction } from '@/lib/actions';
import { getFormDataString } from '@/lib/form-data';
import { SharedAccountState } from '@gw2me/database';
import { after } from 'next/server';
import { sendMail } from '@/lib/mail';
import AccountShareInvitation from '@gw2me/emails/account-share-invitation';
import { getBaseUrlFromHeaders } from '@/lib/url';

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

  const owner = await getUser();
  if(!owner) {
    return { error: 'Not logged in' };
  }

  if(!username) {
    return { error: 'Please enter a username' };
  }

  // find account
  const account = await db.account.findUnique({
    where: { id: accountId, userId: owner.id },
    select: { id: true, accountName: true, shares: { select: { userId: true }}}
  });

  if(!account) {
    return { error: 'Account not found' };
  }

  // find user
  const user = await db.user.findUnique({
    where: { name: username, NOT: { id: owner.id }},
    include: { defaultEmail: true },
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

  // send email to user if they have a default email configured
  const email = user.defaultEmail?.email;
  if(email) {
    const accountsLink = new URL('/accounts', await getBaseUrlFromHeaders()).toString();

    after(() => sendMail(
      'Invitation for ' + account.accountName,
      email,
      <AccountShareInvitation username={user.name} accountName={account.accountName} owner={owner.name} accountsLink={accountsLink}/>
    ));
  }

  revalidatePath(`/accounts/${account.id}`);
  return { success: `${user.name} received an invitation to use your shared account.` };
});

export const manageSharedUser = createAction(async (_, formData) => {
  const removeSharedAccountId = getFormDataString(formData, 'removeSharedAccountId');

  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  if(removeSharedAccountId) {
    const shared = await db.sharedAccount.delete({
      where: { id: removeSharedAccountId, account: { userId: session.userId }},
      select: {
        accountId: true,
        state: true,
        user: { select: { name: true }},
        _count: { select: { applicationGrants: true }}
      },
    });

    revalidatePath(`/accounts/${shared.accountId}`);

    return {
      success: (shared.state === SharedAccountState.Active && shared._count.applicationGrants > 0)
        ? `This account is no longer shared with ${shared.user.name}. They might still be able to access the Guild Wars 2 API for up to 10 minutes.`
        : `This account is no longer shared with ${shared.user.name}.`
    };
  }

  return { error: 'Unknown action' };
});
