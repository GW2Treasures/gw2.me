import { FormState } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function deleteApplication(id: string, _: FormState, data: FormData): Promise<FormState> {
  'use server';

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

  redirect('/dev/applications');
};
