'use server';

import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { getSession } from '@/lib/session';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { randomBytes, scrypt } from 'crypto';
import { revalidatePath } from 'next/cache';

export interface GenerateClientSecretFormState extends FormState {
  clientSecret?: { id: string, secret: string }
}

export async function generateClientSecret(_: GenerateClientSecretFormState, formData: FormData): Promise<GenerateClientSecretFormState> {
  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in.' };
  }

  const clientId = getFormDataString(formData, 'clientId');

  if(!clientId) {
    return { error: 'Invalid client id.' };
  }

  const client = await db.client.findUnique({
    where: { id: clientId, application: { ownerId: session.userId }},
    select: {
      applicationId: true,
      _count: { select: { secrets: true }},
    }
  });

  if(!client) {
    return { error: 'Invalid client.' };
  }

  if(client._count.secrets >= 10) {
    return { error: 'Can\'t create more than 10 secrets.' };
  }

  const clientSecretBuffer = randomBytes(32);
  const salt = randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(clientSecretBuffer, salt, 32, (error, key) => {
      if(error) {
        reject(error);
      }

      resolve(key);
    });
  });

  const saltHex = salt.toString('base64');
  const hashHex = hash.toString('base64');

  const created = await db.clientSecret.create({
    data: {
      clientId,
      secret: `${saltHex}:${hashHex}`,
    },
    select: { id: true }
  });

  revalidatePath(`/dev/applications/${client.applicationId}`);

  return {
    success: 'Client secret generated. Copy the client secret and store it somewhere safe. You will not be able to see the generated client secret again.',
    clientSecret: {
      id: created.id,
      secret: clientSecretBuffer.toString('base64url')
    }
  };
}

export async function deleteClientSecret(_: FormState, formData: FormData) {
  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in.' };
  }

  const clientSecretId = getFormDataString(formData, 'clientSecretId');

  if(!clientSecretId) {
    return { error: 'Invalid secret id.' };
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
    return { error: 'Client not found.' };
  }

  if(client._count.secrets === 1) {
    return { error: 'At least one client secret is required. Create a new client secret first and update your application to use it before deleting this client secret.' };
  }

   await db.clientSecret.delete({
    where: { id: clientSecretId },
    select: { id: true },
  });

  revalidatePath(`/dev/applications/${client.applicationId}`);

  return { success: 'Deleted client secret.' };
}
