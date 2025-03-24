'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteClient(applicationId: string, clientId: string): Promise<FormState> {
  // ensure user is logged in
  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  // get the existing application and verify ownership
  const application = await db.application.findUnique({
    where: { id: applicationId, ownerId: session.userId },
    include: {
      clients: { select: { id: true, name: true }}
    }
  });

  if(!application) {
    return { error: 'Application not found' };
  }

  // create client
  await db.client.delete({
    where: {
      id: clientId,
      applicationId,
      application: { ownerId: session.userId }
    }
  });

  revalidatePath(`/dev/applications/${applicationId}/clients`);

  // redirect back to the client list
  redirect(`/dev/applications/${applicationId}/clients`);
}
