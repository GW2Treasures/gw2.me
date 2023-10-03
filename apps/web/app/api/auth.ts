import { db } from '@/lib/db';
import { Scope } from '@gw2me/api';
import { Authorization, AuthorizationType } from '@gw2me/database';
import { NextRequest, NextResponse } from 'next/server';

type AuthorizedRouteHandler<Params> =
 | ((authorization: Authorization) => Promise<Response>)
 | ((authorization: Authorization, request: NextRequest) => Promise<Response>)
 | ((authorization: Authorization, request: NextRequest, params: Params) => Promise<Response>)

type RouteHandler<Params> = ((request: NextRequest, params: Params) => Promise<Response>)

export function withAuthorization<Params>(scopes?: Scope[] | { oneOf: Scope[]}): (handler: AuthorizedRouteHandler<Params>) => RouteHandler<Params> {
  return function(handler) {
    return async function(request: NextRequest, params: Params) {
      const auth = request.headers.get('Authorization');

      if(!auth) {
        return NextResponse.json({ error: true }, { status: 401 });
      }

      const [tokenType, token] = auth.split(' ');

      if(tokenType !== 'Bearer' || !token) {
        return NextResponse.json({ error: true }, { status: 400 });
      }

      const authorization = await db.authorization.findUnique({ where: { type_token: { token, type: AuthorizationType.AccessToken }}, include: { accounts: true }});

      if(!authorization || (scopes && Array.isArray(scopes) && scopes.some((scope) => !authorization.scope.includes(scope))) || (scopes && 'oneOf' in scopes && !scopes.oneOf.some((scope) => authorization.scope.includes(scope)))) {
        return NextResponse.json({ error: true }, { status: 401 });
      }

      return handler(authorization, request, params);
    };
  };
}

export const Gw2Scopes = [Scope.GW2_Account, Scope.GW2_Inventories, Scope.GW2_Characters, Scope.GW2_Tradingpost, Scope.GW2_Wallet, Scope.GW2_Unlocks, Scope.GW2_Pvp, Scope.GW2_Builds, Scope.GW2_Progression, Scope.GW2_Guilds];
