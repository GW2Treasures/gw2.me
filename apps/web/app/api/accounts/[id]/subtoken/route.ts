import { db } from '@/lib/db';
import { SubtokenResponse, Scope } from '@gw2me/api';
import { NextResponse } from 'next/server';
import { Gw2Scopes, withAuthorization } from '../../../auth';
import { Authorization } from '@gw2me/database';

interface Context {
  params: { id: string }
}

export const GET = withAuthorization<Context>({ oneOf: Gw2Scopes })(
  async (authorization: Authorization, _, { params: { id: accountId }}) => {
    // get required gw2 permissions from authorization scope
    const requiredPermissions = (authorization.scope as Scope[])
      .filter((scope) => Gw2Scopes.includes(scope))
      .map((scope) => scope.substring(4));

    // load account and api token
    const account = await db.account.findFirst({
      where: { accountId, authorizations: { some: { id: authorization.id }}},
      select: {
        apiTokens: {
          where: { permissions: { hasEvery: requiredPermissions }},
          select: { token: true },
        }
      }
    });

    // check if account and api token were found
    if(!account || account.apiTokens.length === 0) {
      return NextResponse.json({ error: true, error_message: 'Account or token not found' }, { status: 404 });
    }

    // get random api token
    const apiToken = account.apiTokens[Math.floor(Math.random() * account.apiTokens.length)];

    // create expiration time in 10 minutes
    const expire = new Date();
    expire.setMinutes(expire.getMinutes() + 10);

    // create subtoken
    const apiResponse = await fetch(`https://api.guildwars2.com/v2/createsubtoken?expire=${expire.toISOString()}&permissions=${requiredPermissions.join(',')}`, {
      headers: { 'Authorization': `Bearer ${ apiToken.token }` }
    });

    if(apiResponse.status !== 200) {
      return NextResponse.json({ error: true }, { status: 500 });
    }

    const { subtoken } = await apiResponse.json();

    const response: SubtokenResponse = {
      subtoken,
      expiresAt: expire.toISOString()
    };

    return NextResponse.json(response);
  }
);
