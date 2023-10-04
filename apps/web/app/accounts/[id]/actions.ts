'use server';

import { FormState } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { revalidatePath } from 'next/cache';

export async function updateDisplayName(id: string, state: FormState, formData: FormData): Promise<FormState> {
  const displayName = formData.get('displayName');

  if(typeof displayName !== 'string') {
    return { error: 'Invalid displayName' };
  }

  const user = await getUser();

  if(!user) {
    return { error: 'Not logged in' };
  }

  await db.account.updateMany({ where: { id, userId: user.id }, data: { displayName }});

  revalidatePath(`/accounts/${id}`);

  return { success: 'Custom Name updated' };
}

export async function deleteApiKey(state: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get('id');

  if(typeof id !== 'string') {
    return { error: 'Invalid id' };
  }

  const user = await getUser();

  if(!user) {
    return { error: 'Not logged in' };
  }

  try {
    await db.apiToken.delete({ where: { id, account: { userId: user.id }}});
  } catch {
    return { error: 'Error deleting key' };
  }

  revalidatePath(`/accounts/${id}`);

  return { success: 'API Key deleted' };
}
