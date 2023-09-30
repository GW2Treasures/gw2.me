import { db } from '@/lib/db';
import { Scope, AccountsResponse } from '@gw2me/api';
import { AuthorizationType } from '@gw2me/database';
import { hasGW2Scopes } from 'app/oauth2/authorize/validate';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');

  if(!auth) {
    return NextResponse.json({ error: true }, { status: 401 });
  }

  const [tokenType, token] = auth.split(' ');

  if(tokenType !== 'Bearer' || !token) {
    return NextResponse.json({ error: true }, { status: 400 });
  }

  const authorization = await db.authorization.findUnique({ where: { type_token: { token, type: AuthorizationType.AccessToken }}, include: { accounts: true }});

  if(!authorization || !hasGW2Scopes(authorization.scope as Scope[])) {
    return NextResponse.json({ error: true }, { status: 401 });
  }

  const response: AccountsResponse = {
    accounts: authorization.accounts.map(({ accountId, accountName }) => ({ id: accountId, name: accountName }))
  };

  return NextResponse.json(response);
}
