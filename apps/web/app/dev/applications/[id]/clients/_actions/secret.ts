'use server';

import { createAction, error } from '@/lib/actions';
import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { getSession } from '@/lib/session';
import { generateClientSecretAndHash } from '@/lib/token';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { revalidatePath } from 'next/cache';

export interface GenerateClientSecretFormState extends FormState {
  clientSecret?: { id: string, secret: string }
}

export const generateClientSecret = createAction<GenerateClientSecretFormState>(async function generateClientSecret(_, formData) {
  const session = await getSession();

  if(!session) {
    error('Not logged in.');
  }

  const clientId = getFormDataString(formData, 'clientId');

  if(!clientId) {
    error('Invalid client id.');
  }

  const client = await db.client.findUnique({
    where: { id: clientId, application: { ownerId: session.userId }},
    select: {
      applicationId: true,
      _count: { select: { secrets: true }},
    }
  });

  if(!client) {
    error('Invalid client.');
  }

  if(client._count.secrets >= 10) {
    error('Can\'t create more than 10 secrets.');
  }

  const { hashed, raw } = await generateClientSecretAndHash();

  const created = await db.clientSecret.create({
    data: {
      clientId,
      secret: hashed,
    },
    select: { id: true }
  });

  revalidatePath(`/dev/applications/${client.applicationId}`);

  return {
    success: 'Client secret generated. Copy the client secret and store it somewhere safe. You will not be able to view the generated client secret again.',
    clientSecret: {
      id: created.id,
      secret: raw
    }
  };
});

export const deleteClientSecret = createAction(async function deleteClientSecret(_, formData) {
  const session = await getSession();

  if(!session) {
    error('Not logged in.');
  }

  const clientSecretId = getFormDataString(formData, 'clientSecretId');

  if(!clientSecretId) {
    error('Invalid secret id.');
  }

  const client = await db.client.findFirst({
    where: {
      secrets: { some: { id: clientSecretId }},
      application: { ownerId: session.userId },
    },
    select: {
      applicationId: true,
      _count: { select: { secrets: true }},
    },
  });

  if(!client) {
    error('Client not found.');
  }

  if(client._count.secrets === 1) {
    error('At least one client secret is required. Create a new client secret first and update your application to use it before deleting this client secret.');
  }

   await db.clientSecret.delete({
    where: { id: clientSecretId },
    select: { id: true },
  });

  revalidatePath(`/dev/applications/${client.applicationId}`);

  return { success: 'Deleted client secret.' };
});
