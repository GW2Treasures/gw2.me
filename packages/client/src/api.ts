import type { Options } from './types';
import { jsonOrError } from './util';

export interface UserResponse {
  user: {
    id: string;
    name: string;
    email?: string;
    emailVerified?: boolean;
  }
}

export interface AccountsResponse {
  accounts: {
    id: string;
    name: string;
    verified?: boolean;
    displayName?: string | null;
  }[]
}

export interface SubtokenResponse {
  subtoken: string;
  expiresAt: string;
}

export class Gw2MeApi {
  constructor(private access_token: string, private options?: Partial<Options>) {}

  user(): Promise<UserResponse> {
    return fetch(this.#getUrl('api/user'), {
      headers: { 'Authorization': `Bearer ${this.access_token}` },
      cache: 'no-store',
    }).then(jsonOrError);
  }

  accounts(): Promise<AccountsResponse> {
    return fetch(this.#getUrl('api/accounts'), {
      headers: { 'Authorization': `Bearer ${this.access_token}` },
      cache: 'no-store',
    }).then(jsonOrError);
  }

  subtoken(accountId: string): Promise<SubtokenResponse> {
    return fetch(this.#getUrl(`api/accounts/${accountId}/subtoken`), {
      headers: { 'Authorization': `Bearer ${this.access_token}` },
      cache: 'no-store',
    }).then(jsonOrError);
  }

  #getUrl(url: string) {
    return new URL(url, this.options?.url || 'https://gw2.me/');
  }
}
