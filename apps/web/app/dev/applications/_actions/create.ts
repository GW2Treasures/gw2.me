'use server';

import { FormState } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';

export async function createApplication(_: FormState, data: FormData): Promise<FormState> {
  const user = await getUser();

  if(!user) {
    return { error: 'Not logged in' };
  }

  const name = data.get('name');

  if(!name || typeof name !== 'string' || name.trim() === '') {
    return { error: 'Invalid name' };
  }

  let applicationId: string;

  try {
    const application = await db.application.create({
      data: {
        name: name.trim(),
        clientId: randomUUID(),
        ownerId: user.id
      },
      select: {
        id: true
      }
    });

    applicationId = application.id;
  } catch {
    return { error: 'Unknown error' };
  }

  redirect(`/dev/applications/${applicationId}`);
};
