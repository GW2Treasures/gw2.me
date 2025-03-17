import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import accountIcon from './fed-cm-account.png';
import { getUrlFromRequest } from '@/lib/url';
import { db } from '@/lib/db';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { corsHeaders } from '@/lib/cors-header';

export async function GET(request: NextRequest) {
  // verify `Sec-Fetch-Dest: webidentity` header is set
  if(request.headers.get('Sec-Fetch-Dest') !== 'webidentity') {
    console.error('[fed-cm/accounts] Sec-Fetch-Dest invalid');
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'Missing `Sec-Fetch-Dest: webidentity` header' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // get user
  const user = await getUser();

  if(!user) {
    console.error('[fed-cm/accounts] no session');
    return Response.json(
      { error: { code: OAuth2ErrorCode.access_denied, details: 'no session' }},
      { status: 401, headers: corsHeaders(request) }
    );
  }

  // get approved applications that are not expired and include the scopes "identify email"
  const approvedClients = await db.client.findMany({
    where: { application: { users: { some: { userId: user.id }}}},
    select: { id: true }
  });

  // get base url to build absolute url to picture
  const baseUrl = getUrlFromRequest(request);

  // respond with account
  return NextResponse.json({
    accounts: [{
      id: user.id,
      name: user.name,
      email: user.defaultEmail?.email ?? user.name,
      picture: new URL(accountIcon.src, baseUrl),
      approved_clients: approvedClients.map(({ id }) => id)
    }]
  });
}
