import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';

export async function editApplication(data: FormData) {
  'use server';

  const user = await getUser();
  const id = data.get('id')?.toString();

  if(!id || !user) {
    throw new Error();
  }

  await db.application.updateMany({
    where: { ownerId: user.id, id },
    data: {
      name: data.get('name')?.toString(),
      description: data.get('description')?.toString(),
      public: !!data.get('public')?.toString(),
      publicUrl: data.get('publicUrl')?.toString(),
      callbackUrls: data.get('callbackUrls')?.toString().replaceAll('\r', '').split('\n'),
    }
  });
};
