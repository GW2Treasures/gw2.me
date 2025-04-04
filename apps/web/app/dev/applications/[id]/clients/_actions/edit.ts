'use server';

import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { getSession } from '@/lib/session';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { revalidatePath } from 'next/cache';

export async function editOAuth2Client(applicationId: string, clientId: string, _: FormState, form: FormData): Promise<FormState> {
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
  const callbackUrlsRaw = getFormDataString(form, 'callbackUrls');

  if(!name) {
    return { error: 'Name is required' };
  }

  if(application.clients.some((other) => other.id !== clientId && other.name === name)) {
    return { error: 'Name has to be unique' };
  }

  if(callbackUrlsRaw === undefined) {
    return { error: 'Invalid redirect URLs' };
  }

  // verify callbackUrls
  let callbackUrls: string[];
  try {
    callbackUrls = callbackUrlsRaw
      .split(/\r|\n/g)
      .map((url) => url.trim())
      .filter((url) => url !== '')
      .map((url) => {
        const u = new URL(url);

        // ignore port for loopback ips (see https://datatracker.ietf.org/doc/html/rfc8252#section-7.3)
        if(u.hostname === '127.0.0.1' || u.hostname === '[::1]') {
          u.port = '';
        }

        return u.toString();
    });
  } catch {
    return { error: 'Invalid callback URLs' };
  }

  revalidatePath(`/dev/applications/${applicationId}/clients`);

  await db.client.update({
    where: { id: clientId, applicationId },
    data: {
      name,
      callbackUrls
    },
  });

  return { success: 'Application saved' };
}
