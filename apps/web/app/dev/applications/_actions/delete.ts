import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';

export async function deleteApplication(data: FormData) {
  'use server';

  const user = await getUser();
  const id = data.get('id')?.toString();

  if(!id || !user) {
    throw new Error();
  }

  await db.application.deleteMany({
    where: { ownerId: user.id, id }
  });

  redirect('/dev/applications');
};
