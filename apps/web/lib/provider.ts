import { UserProviderType } from '@gw2me/database';

export function isValidProviderType(provider: string): provider is UserProviderType {
  return Object.values(UserProviderType).includes(provider as UserProviderType);
}
