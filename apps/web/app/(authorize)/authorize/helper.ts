import { AuthorizationRequestType, Prisma } from '@gw2me/database';
import { AuthorizationRequestData, AuthorizationRequest } from './types';
import { db } from '@/lib/db';
import { expiresAt } from '@/lib/date';
import { notExpired } from '@/lib/db/helper';
import { getSession } from '@/lib/session';

export async function createAuthorizationRequest<T extends AuthorizationRequestType>(type: T, data: AuthorizationRequestData<T>): Promise<AuthorizationRequest> {
  // TODO: verify???

  const authorizationRequest = await db.authorizationRequest.create({
    data: {
      data: data as unknown as Prisma.JsonObject,
      type,
      clientId: data.client_id,
      expiresAt: expiresAt(60 * 5),
      userId: await getOptionalUserId(),
    }
  });

  return authorizationRequest as AuthorizationRequest;
}

export async function cancelAuthorizationRequest(id: string) {
  const canceled = await db.authorizationRequest.update({
    where: { id, state: 'Pending', ...notExpired },
    data: {
      state: 'Canceled',
      userId: await getOptionalUserId(),
    },
  });

  if(!canceled) {
    throw new Error('Authorization request could not be canceled.');
  }

  return canceled as AuthorizationRequest;
}

async function getOptionalUserId() {
  const session = await getSession();
  return session?.userId;
}
