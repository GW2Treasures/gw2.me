import { AccountsResponse, Scope } from '@gw2me/client';
import { Authorization } from '@gw2me/database';
import { NextResponse } from 'next/server';
import { getApplicationGrantByAuthorization, Gw2Scopes, OptionsHandler, withAuthorization } from '../auth';

export const GET = withAuthorization({ oneOf: [...Gw2Scopes, Scope.Accounts] })(
  async (authorization: Authorization) => {
    // get accounts from application grant
    const applicationGrant = getApplicationGrantByAuthorization(authorization);
    const [accounts, sharedAccounts] = await Promise.all([
        applicationGrant.accounts({
          orderBy: { createdAt: 'asc' },
          select: {
            accountId: true,
            accountName: true,
            displayName: authorization.scope.includes(Scope.Accounts_DisplayName),
            verified: authorization.scope.includes(Scope.Accounts_Verified)
          }
        }),
        applicationGrant.sharedAccounts({
          orderBy: { createdAt: 'asc' },
          select: {
            displayName: authorization.scope.includes(Scope.Accounts_DisplayName),
            account: { select: { accountId: true, accountName: true }}
          }
        })
      ]);

    const response: AccountsResponse = {
      accounts: [
        ...(accounts ?? []).map(({ accountId, accountName, displayName, verified }) => ({
          id: accountId,
          name: accountName,
          displayName,
          verified,
          shared: false,
        })),
        ...(sharedAccounts ?? []).map(({ account, displayName }) => ({
          id: account.accountId,
          name: account.accountName,
          displayName,
          verified: authorization.scope.includes(Scope.Accounts_Verified) ? false : undefined,
          shared: true,
        })),
      ]
    };

    return NextResponse.json(response);
  }
);

export const OPTIONS = OptionsHandler;
