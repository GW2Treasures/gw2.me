import { Options } from './types';

export interface UserResponse {
  user: {
    id: string;
    name: string;
    email?: string;
  }
}

export interface AccountsResponse {
  accounts: {
    id: string;
    name: string;
  }[]
}

export interface SubtokenResponse {
  subtoken: string;
  expiresAt: string;
}

export class Gw2MeApi {
  constructor(private access_token: string, private options?: Partial<Options>) {}

  user(): Promise<UserResponse> {
    return fetch(`${this.#getUrl()}api/user`, {
      headers: { 'Authorization': `Bearer ${this.access_token}` },
      cache: 'no-store',
    }).then((r) => r.json());
  }

  accounts(): Promise<AccountsResponse> {
    return fetch(`${this.#getUrl()}api/accounts`, {
      headers: { 'Authorization': `Bearer ${this.access_token}` },
      cache: 'no-store',
    }).then((r) => r.json());
  }

  subtoken(accountId: string): Promise<SubtokenResponse> {
    return fetch(`${this.#getUrl()}api/accounts/${accountId}/subtoken`, {
      headers: { 'Authorization': `Bearer ${this.access_token}` },
      cache: 'no-store',
    }).then((r) => r.json());
  }

  #getUrl() {
    return this.options?.url || 'https://gw2.me/';
  }
}
