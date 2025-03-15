import { Authorization, AuthorizationRequestType, AuthorizationType, Prisma } from '@gw2me/database';
import { AuthorizationRequestData, AuthorizationRequest } from './types';
import { db } from '@/lib/db';
import { expiresAt } from '@/lib/date';
import { notExpired } from '@/lib/db/helper';
import { getSession } from '@/lib/session';
import { normalizeScopes } from '../oauth2/authorize/validate';
import { Scope } from '@gw2me/client';

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

export async function getPreviousAuthorizationMatchingScopes(authorizationRequest: AuthorizationRequest): Promise<false | (Authorization & { accounts: { id: string }[] })> {
  const session = await getSession();

  // if the user is not logged in, we need to show the auth/login screen
  if(!session) {
    return false;
  }

  // get requested scopes
  const scopes = new Set(authorizationRequest.data.scope.split(' ') as Scope[]);
  normalizeScopes(scopes);

  console.log('[getPreviousAuthorizationMatchingScopes]', { clientId: authorizationRequest.clientId, userId: session.userId, scopes });

  // get previous authorization
  const previousAuthorization = await db.authorization.findFirst({
    where: {
      clientId: authorizationRequest.clientId,
      userId: session.userId,
      type: { not: AuthorizationType.Code },
      scope: { hasEvery: Array.from(scopes) }
    },
    include: { accounts: { select: { id: true }}}
  });

  return previousAuthorization ?? false;
}

async function getOptionalUserId() {
  const session = await getSession();
  return session?.userId;
}
