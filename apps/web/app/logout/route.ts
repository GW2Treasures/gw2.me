import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LoginErrorCookieName, SessionCookieName } from '@/lib/cookie';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUrlFromRequest } from '@/lib/url';
import { expiresAt } from '@/lib/date';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  // check if we even have a session to logout
  if(!cookieStore.has(SessionCookieName)) {
    redirect('/login');
  }

  // get the session id
  const sessionId = cookieStore.get(SessionCookieName)!.value;

  // try to delete session in db if set
  // use deleteMany instead of delete so it doesn't fail if there is no matching session in db
  if(sessionId) {
    await db.userSession.deleteMany({ where: { id: sessionId }});
  }

  // delete session cookie
  cookieStore.delete(SessionCookieName);
  cookieStore.delete(LoginErrorCookieName);

  // set cookie to show logout notification
  cookieStore.set('logout', '1', { expires: expiresAt(5), httpOnly: true, path: '/login', secure: true });

  // redirect to login and show logout
  const url = getUrlFromRequest(request);
  return NextResponse.redirect(
    new URL('/login', url),
    { headers: { 'Set-Login': 'logged-out' }}
  );
}
