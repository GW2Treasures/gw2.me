import { db } from '@/lib/db';
import { AccountsResponse, Scope } from '@gw2me/client';
import { Authorization } from '@gw2me/database';
import { NextResponse } from 'next/server';
import { Gw2Scopes, withAuthorization } from '../auth';
import { corsHeaders } from '@/lib/cors-header';

export const GET = withAuthorization({ oneOf: [...Gw2Scopes, Scope.Accounts] })(
  async (authorization: Authorization) => {
    const accounts = await db.account.findMany({
      where: { authorizations: { some: { id: authorization.id }}},
      select: {
        accountId: true,
        accountName: true,
        displayName: authorization.scope.includes(Scope.Accounts_DisplayName),
        verified: authorization.scope.includes(Scope.Accounts_Verified)
      }
    });

    const response: AccountsResponse = {
      accounts: accounts.map(({ accountId, accountName, displayName, verified }) => ({
        id: accountId,
        name: accountName,
        verified,
        displayName
      }))
    };

    return NextResponse.json(response);
  }
);

export const OPTIONS = (request: Request) => {
  return new NextResponse(null, {
    headers: corsHeaders(request)
  });
};
