'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { ApplicationType, Prisma } from '@gw2me/database';
import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';

export async function createApplication(_: FormState, data: FormData): Promise<FormState> {
  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  const name = data.get('name');

  if(!name || typeof name !== 'string' || name.trim() === '') {
    return { error: 'Invalid name' };
  }

  const type = data.get('type');

  if(!type || typeof type !== 'string' || !isValidApplicationType(type)) {
    return { error: 'Invalid type' };
  }

  let applicationId: string;

  try {
    const application = await db.application.create({
      data: {
        name: name.trim(),
        type,
        clientId: randomUUID(),
        ownerId: session.userId
      },
      select: {
        id: true
      }
    });

    applicationId = application.id;
  } catch(e) {
    if(e instanceof Prisma.PrismaClientKnownRequestError) {
      // unique constraint failed - https://www.prisma.io/docs/orm/reference/error-reference#p2002
      if(e.code === 'P2002') {
        return { error: 'Name already in use' };
      }
    }

    console.error(e);
    return { error: 'Unknown error' };
  }

  redirect(`/dev/applications/${applicationId}`);
};

function isValidApplicationType(type: string): type is ApplicationType {
  return type in ApplicationType;
}
