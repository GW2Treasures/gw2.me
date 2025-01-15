'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function deleteApplication(id: string): Promise<FormState> {
  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  try {
    await db.application.deleteMany({
      where: { ownerId: session.userId, id }
    });
  } catch {
    return { error: 'Unknown error' };
  }

  revalidatePath('/dev/applications');
  redirect('/dev/applications');
}
