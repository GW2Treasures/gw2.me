import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import accountIcon from './fed-cm-account.png';
import { getUrlFromRequest } from '@/lib/url';

export async function GET(request: NextRequest) {
  const user = await getUser();

  if(!user) {
    return new Response(null, { status: 401 });
  }

  const baseUrl = getUrlFromRequest(request);

  return NextResponse.json({
    accounts: [{
      id: user.id,
      name: user.name,
      email: user.email ?? user.name,
      picture: new URL(accountIcon.src, baseUrl),
      approved_clients: [],
    }]
  });
}
