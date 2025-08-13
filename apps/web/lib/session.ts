import 'server-only';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { cache } from 'react';
import { SessionCookieName } from './cookie';
import { Prisma } from '@gw2me/database';
import { redirect } from 'next/navigation';

/** Get the current session */
export const getSession = cache(async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SessionCookieName)?.value;

  return sessionId
    ? await getSessionFromDb(sessionId)
    : undefined;
});

export async function getSessionOrRedirect() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/** Get the user for the current session */
export const getUser = cache(async function getUser() {
  const session = await getSession();

  if(!session) {
    return undefined;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { defaultEmail: { select: { id: true, email: true }}}
  });

  return user ?? undefined;
});


async function getSessionFromDb(sessionId: string) {
  try {
    // try to update session in db
    const session = await db.userSession.update({
      where: { id: sessionId },
      data: { lastUsed: new Date() },
      select: { id: true, userId: true, providerAccountId: true, providerType: true },
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
