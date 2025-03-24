'use server';

import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { getSession } from '@/lib/session';
import { ClientType } from '@gw2me/database';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { redirect } from 'next/navigation';

export async function addClient(applicationId: string, _: FormState, form: FormData): Promise<FormState> {
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

  // get form data
  const name = getFormDataString(form, 'name');
  const type = getFormDataString(form, 'type');

  // verify name
  if(!name) {
    return { error: 'Name is required' };
  }

  if(application.clients.some((other) => other.name === name)) {
    return { error: 'Name has to be unique' };
  }

  // verify type
  if(!type || !isValidClientType(type)) {
    return { error: 'Invalid type' };
  }

  // create client
  const client = await db.client.create({
    data: {
      name,
      type,
      applicationId,
    }
  });

  // redirect to newly created client
  redirect(`/dev/applications/${applicationId}/clients/${client.id}`);
}


function isValidClientType(type: string): type is ClientType {
  return type in ClientType;
}
