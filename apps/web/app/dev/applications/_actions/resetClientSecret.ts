'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomBytes, scrypt } from 'crypto';

export async function resetClientSecret(clientId: string) {
  const session = await getSession();

  if(!session) {
    throw new Error();
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

  await db.client.updateMany({
    where: { id: clientId, application: { ownerId: session.userId }},
    data: {
      secret: `${saltHex}:${hashHex}`
    }
  });

  return clientSecretBuffer.toString('base64url');
}
