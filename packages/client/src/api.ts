import { createDPoPJwt } from './dpop';
import type { Options } from './types';
import { jsonOrError, okOrError } from './util';

export interface UserResponse {
  user: {
    id: string;
    name: string;
    email?: string;
    emailVerified?: boolean;
  },
  settings?: unknown;
}

export interface AccountsResponse {
  accounts: {
    id: string;
    name: string;
    verified?: boolean;
    displayName?: string | null;
  }[]
}

export interface SubtokenOptions {
  permissions?: string[];
}

export interface SubtokenResponse {
  subtoken: string;
  expiresAt: string;
}

export interface ApiOptions extends Options {
  dpopKeyPair?: CryptoKeyPair
}

export class Gw2MeApi {
  constructor(private access_token: string, private options?: Partial<ApiOptions>) {}

  user(): Promise<UserResponse> {
    return this.#requestWithDpop('api/user')
      .then((request) => fetch(request))
      .then(jsonOrError);
  }

  saveSettings(settings: unknown): Promise<void> {
    return this.#requestWithDpop('api/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      .then((request) => fetch(request))
      .then(okOrError);
  }

  accounts(): Promise<AccountsResponse> {
    return this.#requestWithDpop('api/accounts')
      .then((request) => fetch(request))
      .then(jsonOrError);
  }

  subtoken(accountId: string, options?: SubtokenOptions): Promise<SubtokenResponse> {
    const url = this.#getUrl(`api/accounts/${accountId}/subtoken`);

    if(options?.permissions) {
      url.searchParams.set('permissions', options.permissions.join(','));
    }

    return this.#requestWithDpop(url)
      .then((request) => fetch(request))
      .then(jsonOrError);
  }

  #getUrl(url: string) {
    return new URL(url, this.options?.url || 'https://gw2.me/');
  }

  async #requestWithDpop(endpoint: string | URL, init?: RequestInit): Promise<Request> {
    const url = endpoint instanceof URL ? endpoint : this.#getUrl(endpoint);

    const dpopKeyPair = this.options?.dpopKeyPair;

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `${dpopKeyPair ? 'DPoP' : 'Bearer'} ${this.access_token}`);

    if(dpopKeyPair) {
      const dpop = await createDPoPJwt({ htm: init?.method ?? 'GET', htu: url.toString(), accessToken: this.access_token }, dpopKeyPair);
      headers.set('DPoP', dpop);
    }

    return new Request(
      url,
      { cache: 'no-cache', ...init, headers }
    );
  }
}
