import { db } from '@/lib/db';
import { SubtokenResponse, Scope } from '@gw2me/client';
import { NextResponse } from 'next/server';
import { Gw2Scopes, OptionsHandler, withAuthorization } from '../../../auth';
import { Authorization } from '@gw2me/database';
import { fetchGw2Api } from '@/lib/gw2-api-request';
import { scopeToPermissions } from '@/lib/scope';

export const GET = withAuthorization<RouteContext<'/api/accounts/[id]/subtoken'>>({ oneOf: Gw2Scopes })(
  async (authorization: Authorization, request, { params }) => {
    const { id: accountId } = await params;

    // get permissions authorized by authorization
    const authorizedPermissions = scopeToPermissions(authorization.scope as Scope[]);

    // get requested permissions (or fallback to to all authorized permissions)
    let requestedPermissions;
    try {
      requestedPermissions = request.nextUrl.searchParams.has('permissions')
        ? parsePermissions(request.nextUrl.searchParams.get('permissions')!, authorizedPermissions)
        : authorizedPermissions;
    } catch(error) {
      console.error(error);
      return NextResponse.json({ error: true, error_description: 'Invalid permissions' }, { status: 400 });
    }

    // load account and api token
    const account = await db.account.findFirst({
      where: {
        accountId,
        OR: [
          { applicationGrants: { some: { applicationId: authorization.applicationId, userId: authorization.userId }}},
          { shares: { some: { applicationGrants: { some: { applicationId: authorization.applicationId, userId: authorization.userId }}}}},
        ]
      },
      select: {
        apiTokens: {
          where: { permissions: { hasEvery: requestedPermissions }},
          select: { id: true, token: true },
        }
      }
    });

    // check if account and api token were found
    if(!account || account.apiTokens.length === 0) {
      return NextResponse.json({ error: true, error_description: 'Account or token not found' }, { status: 404 });
    }

    // shuffle api tokens
    const apiTokens = account.apiTokens
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    // create the subtoken, fallback once if we have multiple api keys available
    let response: SubtokenResponse;
    try {
      try {
        response = await createSubtoken(apiTokens[0], requestedPermissions);
      } catch(error) {
        if(account.apiTokens.length > 1) {
          console.error(error);
          console.log('creating subtoken failed, trying again');
          response = await createSubtoken(apiTokens[1], requestedPermissions);
        } else {
          throw error;
        }
      }
    } catch(error) {
      console.error(error);

      return NextResponse.json({ error: true, error_description: 'The Guild Wars 2 API returned an error when creating the subtoken' }, { status: 500 });
    }

    // return response
    return NextResponse.json(response);
  }
);

export const OPTIONS = OptionsHandler;

async function createSubtoken(apiToken: { id: string, token: string }, requiredPermissions: string[]): Promise<SubtokenResponse> {
  // create expiration time in 10 minutes
  const expire = new Date();
  expire.setMinutes(expire.getMinutes() + 10);

  // create subtoken
  let apiResponse;
  try {
    console.log('request subtoken for', apiToken.token);
    apiResponse = await fetchGw2Api(`/v2/createsubtoken?expire=${expire.toISOString()}&permissions=${requiredPermissions.join(',')}`, { accessToken: apiToken.token });
  } catch(e) {
    console.error(e);

    // increase errorCount for this token in API
    await db.apiToken.update({
      data: {
        errorCount: { increment: 1 },
        usedAt: new Date(),
      },
      where: { id: apiToken.id }
    });

    // return error response
    throw new Error('The Guild Wars 2 API returned an error when creating the subtoken', { cause: e });
  }

  // reset errorCount and set usedAt
  await db.apiToken.update({
    data: {
      errorCount: 0,
      usedAt: new Date(),
    },
    where: { id: apiToken.id },
  });

  return {
    subtoken: apiResponse.subtoken,
    expiresAt: expire.toString()
  };
}

function parsePermissions(permissions: string, authorizedPermissions: string[]): string[] {
  if(permissions.length === 0) {
    return [];
  }

  const requestedPermissions = permissions.split(',');
  const invalidPermissions = requestedPermissions.filter((permission) => !authorizedPermissions.includes(permission));

  if(invalidPermissions.length > 0) {
    throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
  }

  return requestedPermissions;
}
