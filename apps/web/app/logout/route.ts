import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { SessionCookieName } from '@/lib/cookie';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  // check if we even have a session to logout
  if(!cookies().has(SessionCookieName)) {
    redirect('/login');
  }

  // get the session id
  const sessionId = cookies().get(SessionCookieName)!.value;

  // try to delete session in db
  // use deleteMany instead of delete so it doesn't fail if there is no matching session in db
  await db.userSession.deleteMany({ where: { id: sessionId }});

  // delete session cookie
  cookies().delete(SessionCookieName);

  // redirect to login and show logout
  redirect('/login?logout');
}
