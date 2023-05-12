'use server';

import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { randomBytes, scrypt } from 'crypto';

export async function resetClientSecret(applicationId: string) {
  const user = await getUser();

  if(!user) {
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

  await db.application.updateMany({
    where: { ownerId: user.id, id: applicationId },
    data: {
      clientSecret: `${saltHex}:${hashHex}`
    }
  });

  return clientSecretBuffer.toString('base64url');
};
