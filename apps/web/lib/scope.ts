import { Permission } from '@gw2api/types/data/tokeninfo';
import { Scope } from '@gw2me/client';

export function hasGW2Scopes(scopes: Scope[]): boolean {
  return scopes.some((scope) => scope.startsWith('gw2:'));
}

export function scopeToPermissions(scopes: Scope[]): Permission[] {
  return scopes
    .filter((scope) => scope.startsWith('gw2:'))
    .map((permission) => permission.substring(4) as Permission);
}
