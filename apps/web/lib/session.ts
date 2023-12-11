import 'server-only';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { cache } from 'react';
import { SessionCookieName } from './cookie';
import { Prisma, User } from '@gw2me/database';

/** Get the current session */
export const getSession = cache(async function getSession(): Promise<{ id: string, userId: string } | undefined> {
  const sessionId = cookies().get(SessionCookieName)?.value;

  return sessionId
    ? await getSessionFromDb(sessionId)
    : undefined;
});

/** Get the user for the current session */
export const getUser = cache(async function getUser(): Promise<User | undefined> {
  const session = await getSession();

  return session
    ? (await db.user.findUnique({ where: { id: session.userId }}) ?? undefined)
    : undefined;
});


async function getSessionFromDb(sessionId: string) {
  try {
    // try to update session in db
    const session = await db.userSession.update({
      where: { id: sessionId },
      data: { lastUsed: new Date() },
      select: { id: true, userId: true },
    });

    return session;
  } catch(error) {
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // session not found
      return undefined;
    }

    // rethrow all other errors
    throw error;
  }
}
