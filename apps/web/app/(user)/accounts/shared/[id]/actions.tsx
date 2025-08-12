'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateDisplayName(id: string, state: FormState, formData: FormData): Promise<FormState> {
  const displayName = formData.get('displayName');

  if(typeof displayName !== 'string') {
    return { error: 'Invalid displayName' };
  }

  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  await db.sharedAccount.updateMany({
    where: { id, userId: session.userId },
    data: { displayName: displayName.trim() || null }
  });

  revalidatePath(`/accounts/shared/${id}`);

  return { success: 'Custom Name updated' };
}

export async function removeAccount(id: string): Promise<FormState> {
  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  const account = await db.sharedAccount.findUnique({
    where: { id, userId: session.userId }
  });

  if(!account) {
    return { error: 'Account not found' };
  }

  await db.sharedAccount.delete({
    where: { id, userId: session.userId }
  });

  revalidatePath('/accounts');
  redirect('/accounts');
}
