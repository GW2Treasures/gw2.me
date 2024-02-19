'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function revokeAccess(_: FormState, formData: FormData): Promise<FormState> {
  const applicationId = formData.get('applicationId');

  if(!applicationId || typeof applicationId !== 'string') {
    return { error: 'Invalid application id' };
  }

  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  await db.authorization.deleteMany({
    where: { applicationId, userId: session.userId }
  });

  return { success: 'Access revoked. The application might still be able to access the Guild Wars 2 API for up to 10 minutes.' };
}
