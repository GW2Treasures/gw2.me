import { getUser } from '@/lib/getUser';
import { getUrlFromParts, getUrlPartsFromRequest } from '@/lib/urlParts';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const parts = getUrlPartsFromRequest(request);

  if(request.nextUrl.searchParams.has('to')) {
    const loginUrl = getUrlFromParts({ ...parts, path: '/login' });
    const response = NextResponse.redirect(loginUrl);

    response.cookies.set({ name: 'RETURN_TO', value: request.nextUrl.searchParams.get('to')!, maxAge: 60 * 5, path: '/login/return' });

    return response;
  } else if(request.cookies.has('RETURN_TO')) {
    const returnTo = Buffer.from(request.cookies.get('RETURN_TO')!.value, 'base64url');

    const returnToUrl = getUrlFromParts({ ...parts, path: returnTo.toString() as any });
    const response = NextResponse.redirect(returnToUrl);

    response.cookies.set({ name: 'RETURN_TO', value: '', expires: new Date(0), path: '/login/return' });

    return response;
  } else {
    const user = await getUser();

    if(user) {
      redirect('/profile');
    } else {
      redirect('/login');
    }
  }
}
