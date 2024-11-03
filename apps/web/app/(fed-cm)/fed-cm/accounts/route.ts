import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import accountIcon from './fed-cm-account.png';
import { getUrlFromRequest } from '@/lib/url';
import { db } from '@/lib/db';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { corsHeaders } from '@/lib/cors-header';
import { Scope } from '@gw2me/client';

export async function GET(request: NextRequest) {
  // verify `Sec-Fetch-Dest: webidentity` header is set
  if(request.headers.get('Sec-Fetch-Dest') !== 'webidentity') {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'Missing `Sec-Fetch-Dest: webidentity` header' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // get user
  const user = await getUser();

  if(!user) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.access_denied, details: 'no session' }},
      { status: 401, headers: corsHeaders(request) }
    );
  }

  // get approved applications that are not expired and include the scopes "identify email"
  const notExpired = {
    OR: [
      { expiresAt: { gte: new Date() }},
      { expiresAt: null }
    ]
  };
  const approvedClients = await db.client.findMany({
    where: { authorizations: { some: { type: 'AccessToken', userId: user.id, ...notExpired, scope: { hasEvery: [Scope.Identify, Scope.Email] }}}},
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
