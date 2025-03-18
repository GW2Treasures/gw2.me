import { AccountsResponse, Scope } from '@gw2me/client';
import { Authorization } from '@gw2me/database';
import { NextResponse } from 'next/server';
import { getApplicationGrantByAuthorization, Gw2Scopes, OptionsHandler, withAuthorization } from '../auth';

export const GET = withAuthorization({ oneOf: [...Gw2Scopes, Scope.Accounts] })(
  async (authorization: Authorization) => {
    // get accounts from application grant
    const accounts = await getApplicationGrantByAuthorization(authorization).accounts({
      orderBy: { createdAt: 'asc' },
      select: {
        accountId: true,
        accountName: true,
        displayName: authorization.scope.includes(Scope.Accounts_DisplayName),
        verified: authorization.scope.includes(Scope.Accounts_Verified)
      }
    }) ?? [];

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

export const OPTIONS = OptionsHandler;
