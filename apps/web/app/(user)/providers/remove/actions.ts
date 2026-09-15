'use server';
import { createAction } from '@/lib/actions';
import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { isValidProviderType } from '@/lib/provider';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const removeProvider = createAction(async (_, formData) => {
  const provider = getFormDataString(formData, 'provider');
  const providerAccountId = getFormDataString(formData, 'providerAccountId');

  if (!provider || !providerAccountId || !isValidProviderType(provider)) {
    throw new Error('Missing provider or provider account ID');
  }

  const session = await getSession();

  if (!session) {
    return { error: 'Not logged in' };
  }

  // handle legacy sessions that don't have a provider set
  if (!session.providerType || !session.providerAccountId) {
    return { error: 'Please logout and log in again' };
  }

  // prevent deleting the current login provider
  if (session.providerType === provider && session.providerAccountId === providerAccountId) {
    return { error: 'Cannot remove the current login provider' };
  }

  await db.userProvider.delete({
    where: { provider_providerAccountId: { provider, providerAccountId }, userId: session.userId }
  });

  revalidatePath('/providers');
  redirect('/providers');
});
