import { action } from '@/lib/action';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';

export const editApplication = action(async (data) => {
  'use server';

  const user = await getUser();
  const id = data.get('id')?.toString();

  if(!id || !user) {
    throw new Error();
  }

  await db.application.updateMany({
    where: { ownerId: user.id, id },
    data: {
      callbackUrls: data.get('callbackUrls')?.toString().replaceAll('\r', '').split('\n')
    }
  });
});
