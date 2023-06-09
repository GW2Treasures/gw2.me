import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUrlFromParts, getUrlPartsFromRequest } from '@/lib/urlParts';
import { SessionCookieName, authCookie } from '@/lib/cookie';

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(SessionCookieName)?.value ?? '';

  if(sessionId) {
    await db.userSession.deleteMany({ where: { id: sessionId }});
  }

  // build login url
  const parts = getUrlPartsFromRequest(request);
  const loginUrl = getUrlFromParts({ ...parts, path: '/login?logout' });

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set({ ...authCookie('', parts.protocol === 'https:'), expires: new Date(0) });

  return response;
}
