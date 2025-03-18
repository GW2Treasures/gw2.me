'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { getFormDataString } from '@/lib/form-data';

export async function revokeAccess(_: FormState, formData: FormData): Promise<FormState> {
  const applicationId = getFormDataString(formData, 'applicationId');

  if(!applicationId) {
    return { error: 'Invalid application id' };
  }

  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  await db.$transaction([
    db.authorization.deleteMany({
      where: { userId: session.userId, client: { applicationId }}
    }),
    db.applicationGrant.deleteMany({
      where: { userId: session.userId, applicationId }
    })
  ]);

  revalidatePath('/applications');

  return { success: 'Access revoked. The application might still be able to access the Guild Wars 2 API for up to 10 minutes.' };
}
