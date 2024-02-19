'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

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

export async function deleteApiKey(state: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get('id');

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
}
