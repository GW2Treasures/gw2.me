'use server';

import { FormState } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';

export async function revokeAccess(_: FormState, formData: FormData): Promise<FormState> {
  const applicationId = formData.get('applicationId');

  if(!applicationId || typeof applicationId !== 'string') {
    return { error: 'Invalid application id' };
  }

  const user = await getUser();

  if(!user) {
    return { error: 'Not logged in' };
  }

  await db.authorization.deleteMany({
    where: { applicationId, userId: user.id }
  });

  return { success: 'Access revoked. The application might still be able to access the Guild Wars 2 API for up to 10 minutes.' };
}
