'use server';

import { createAction } from '@/lib/actions';
import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { getSession } from '@/lib/session';
import { SharedAccountState } from '@gw2me/database';
import { revalidatePath } from 'next/cache';

export const manageSharedAccount = createAction(async (_, formData) => {
  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  const deleteSharedAccountId = getFormDataString(formData, 'deleteSharedAccountId');
  const acceptSharedAccountId = getFormDataString(formData, 'acceptSharedAccountId');

  // either delete or accept have to be set, but not both
  if(!deleteSharedAccountId === !acceptSharedAccountId) {
    return { error: 'Error' };
  }

  const sharedAccountId = deleteSharedAccountId ?? acceptSharedAccountId!;
  const account = await db.sharedAccount.findUnique({
    where: { id: sharedAccountId, userId: session.userId }
  });

  if(!account) {
    return { error: 'Account not found' };
  }

  if(deleteSharedAccountId) {
    await db.sharedAccount.delete({
      where: { userId: session.userId, id: deleteSharedAccountId }
    });

    revalidatePath('/accounts');

    return { success: 'Account removed' };
  }

  if(acceptSharedAccountId) {
    if(account.state !== SharedAccountState.Pending) {
      return { error: 'Account is already accepted' };
    }

    await db.sharedAccount.update({
      where: { userId: session.userId, id: acceptSharedAccountId, state: SharedAccountState.Pending },
      data: { state: SharedAccountState.Active }
    });

    revalidatePath('/accounts');

    return { success: 'Account accepted. You can now select this account when authorizing applications.' };
  }

  return { error: 'Unknown action' };
});
