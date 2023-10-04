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

      const authorization = await db.authorization.findUnique({
        where: { type_token: { token, type: AuthorizationType.AccessToken }}
      });

      if(!authorization || !verifyScopes(authorization.scope as Scope[], scopes)) {
        return NextResponse.json({ error: true }, { status: 401 });
      }

      return handler(authorization, request, params);
    };
  };
}

export const Gw2Scopes = [Scope.GW2_Account, Scope.GW2_Inventories, Scope.GW2_Characters, Scope.GW2_Tradingpost, Scope.GW2_Wallet, Scope.GW2_Unlocks, Scope.GW2_Pvp, Scope.GW2_Builds, Scope.GW2_Progression, Scope.GW2_Guilds];

export function verifyScopes(authorized: Scope[], condition: undefined | Scope[] | { every?: Scope[], oneOf?: Scope[] }): boolean {
  if(!condition) {
    return true;
  }

  const { every, oneOf } = Array.isArray(condition)
    ? { every: condition, oneOf: [] }
    : { every: [], oneOf: [], ...condition };

  const hasEvery = every.every((scope) => authorized.includes(scope));

  if(!hasEvery) {
    console.log('Missing every', { every, authorized });
    return false;
  }

  const hasOneOf = oneOf.length === 0 || oneOf.some((scope) => authorized.includes(scope));

  if(!hasOneOf) {
    console.log('Missing one of', { oneOf, authorized });
    return false;
  }

  return true;
}
