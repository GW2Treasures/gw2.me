import type { DPoPCallback, Options } from './types.js';
import { jsonOrError, okOrError } from './util.js';

export interface UserResponse {
  sub: string,
  user: {
    id: string,
    name: string,
    email?: string,
    emailVerified?: boolean,
  },
  settings?: unknown,
}

export interface AccountsResponse {
  accounts: {
    id: string,
    name: string,
    shared: boolean,
    verified?: boolean,
    displayName?: string | null,
  }[],
}

export interface SubtokenOptions {
  permissions?: string[],
}

export interface SubtokenResponse {
  subtoken: string,
  expiresAt: string,
}

export interface ApiOptions extends Options {
  dpop?: DPoPCallback,
}

export class Gw2MeApi {
  constructor(private access_token: string, private options?: Partial<ApiOptions> | undefined) {}

  /**
   * Fetches information about the current user. Requires the `identify` scope.
   * @see https://gw2.me/dev/docs/users
   */
  user(): Promise<UserResponse> {
    return this.#requestWithDpop('api/user')
      .then((request) => fetch(request))
      .then(jsonOrError<UserResponse>);
  }

  /**
   * Stores user-specific settings.
   * @see https://gw2.me/dev/docs/users#settings
   */
  saveSettings(settings: unknown): Promise<void> {
    return this.#requestWithDpop('api/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      .then((request) => fetch(request))
      .then(okOrError);
  }

  /**
   * Fetches the Guild Wars 2 accounts linked to the current user. Requires the `accounts` scope.
   * @see https://gw2.me/dev/docs/gw2-api#accounts
   */
  accounts(): Promise<AccountsResponse> {
    return this.#requestWithDpop('api/accounts')
      .then((request) => fetch(request))
      .then(jsonOrError<AccountsResponse>);
  }

  /**
   * Generates a subtoken that can be used to authenticate to the Guild Wars 2 API.
   * @see https://gw2.me/dev/docs/gw2-api#subtoken
   */
  subtoken(accountId: string, options?: SubtokenOptions): Promise<SubtokenResponse> {
    const url = this.#getUrl(`api/accounts/${accountId}/subtoken`);

    if(options?.permissions) {
      url.searchParams.set('permissions', options.permissions.join(','));
    }

    return this.#requestWithDpop(url)
      .then((request) => fetch(request))
      .then(jsonOrError<SubtokenResponse>);
  }

  #getUrl(url: string) {
    return new URL(url, this.options?.url || 'https://gw2.me/');
  }

  async #requestWithDpop(endpoint: string | URL, init?: RequestInit): Promise<Request> {
    const url = endpoint instanceof URL ? endpoint : this.#getUrl(endpoint);

    const dpop = this.options?.dpop;

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `${dpop ? 'DPoP' : 'Bearer'} ${this.access_token}`);

    if(dpop) {
      headers.set('DPoP', await dpop({
        htm: init?.method ?? 'GET',
        htu: url.toString(),
        accessToken: this.access_token
      }));
    }

    return new Request(
      url,
      { cache: 'no-cache', ...init, headers }
    );
  }
}
