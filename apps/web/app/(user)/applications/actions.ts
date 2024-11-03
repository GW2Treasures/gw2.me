'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function revokeAccess(_: FormState, formData: FormData): Promise<FormState> {
  const clientId = formData.get('clientId');

  if(!clientId || typeof clientId !== 'string') {
    return { error: 'Invalid client id' };
  }

  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  await db.authorization.deleteMany({
    where: { clientId, userId: session.userId }
  });

  revalidatePath('/applications');

  return { success: 'Access revoked. The application might still be able to access the Guild Wars 2 API for up to 10 minutes.' };
}
