import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import accountIcon from './fed-cm-account.png';
import { getUrlFromRequest } from '@/lib/url';
import { db } from '@/lib/db';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { corsHeaders } from '@/lib/cors-header';
import { IdentityProviderAccountList, isValidWebIdentityRequest } from '@fedcm/server';
import { assert } from '@/lib/oauth/assert';

export async function GET(request: NextRequest): Promise<NextResponse<IdentityProviderAccountList>> {
  try {
    assert(isValidWebIdentityRequest(request), OAuth2ErrorCode.invalid_request, { description: 'Missing `Sec-Fetch-Dest: webidentity` header' });

    // get user
    const user = await getUser();
    assert(user, OAuth2ErrorCode.access_denied, { description: 'no session', httpStatus: 401 });

    // get approved applications that are not expired
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
        username: user.name,
        email: user.defaultEmail?.email,
        picture: new URL(accountIcon.src, baseUrl),
        approved_clients: approvedClients.map(({ id }) => id),
      }]
    }, { headers: corsHeaders(request) });
  } catch(error) {
    if(error instanceof OAuth2Error) {
      return NextResponse.json({
        accounts: [],
        error: error.description
      }, { status: error.httpStatus ?? 400, headers: corsHeaders(request) });
    }

    console.log('[fed-cm/accounts] error');
    console.log(error);

    return NextResponse.json(
      { accounts: [], error: 'Unknown error' },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}
