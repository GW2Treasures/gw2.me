import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LoginErrorCookieName, SessionCookieName } from '@/lib/cookie';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUrlFromRequest } from '@/lib/url';
import { expiresAt } from '@/lib/date';

export async function GET(request: NextRequest) {
  // check if we even have a session to logout
  if(!cookies().has(SessionCookieName)) {
    redirect('/login');
  }

  // get the session id
  const sessionId = cookies().get(SessionCookieName)!.value;

  // try to delete session in db if set
  // use deleteMany instead of delete so it doesn't fail if there is no matching session in db
  if(sessionId) {
    await db.userSession.deleteMany({ where: { id: sessionId }});
  }

  // delete session cookie
  cookies().delete(SessionCookieName);
  cookies().delete(LoginErrorCookieName);

  // set cookie to show logout notification
  cookies().set('logout', '1', { expires: expiresAt(5), httpOnly: true, path: '/login', secure: true });

  // redirect to login and show logout
  const url = getUrlFromRequest(request);
  return NextResponse.redirect(
    new URL('/login', url),
    { headers: { 'Set-Login': 'logged-out' }}
  );
}
