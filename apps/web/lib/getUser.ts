import 'server-only';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { SessionCookieName } from './cookie';

export const getUser = cache(async function getUser() {
  const sessionId = cookies().get(SessionCookieName)?.value;
  const session = sessionId ? await getSessionFromDb(sessionId) : undefined;

  if(sessionId && !session) {
    redirect('/logout');
  }

  return session ? { ...session.user, sessionId: sessionId! } : undefined;
});

async function getSessionFromDb(sessionId: string | null) {
  if(!sessionId) {
    return undefined;
  }

  const update = await db.userSession.updateMany({
    where: { id: sessionId },
    data: { lastUsed: new Date() },
  });

  if(update.count === 1) {
    return db.userSession.findUnique({
      where: { id: sessionId },
      select: { user: { select: { id: true, name: true, roles: true }}}
    }) ?? undefined;
  }

  return undefined;
}
