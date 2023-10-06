import { Scope } from '@gw2me/client';

export function hasGW2Scopes(scopes: Scope[]): boolean {
  return scopes.some((scope) => scope.startsWith('gw2:'));
}
