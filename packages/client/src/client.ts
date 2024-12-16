import { Gw2MeApi } from './api';
import { Gw2MeError, Gw2MeOAuthError } from './error';
import { Gw2MeFedCM } from './fed-cm';
import { type ClientInfo, type Options, Scope } from './types';
import { jsonOrError } from './util';

export interface AuthorizationUrlParams {
  redirect_uri: string;
  scopes: Scope[];
  state?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256';
  prompt?: 'none' | 'consent'
  include_granted_scopes?: boolean;
  verified_accounts_only?: boolean;
}

export interface AuthTokenParams {
  code: string;
  redirect_uri: string;
  code_verifier?: string;
}

export interface RefreshTokenParams {
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string,
  issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
  token_type: 'Bearer',
  expires_in: number,
  refresh_token?: string,
  scope: string,
}

export interface RevokeTokenParams {
  token: string,
}

export interface IntrospectTokenParams {
  token: string,
}

export type IntrospectTokenResponse = {
  active: true,
  scope: string,
  client_id: string,
  token_type: 'Bearer',
  exp?: number,
} | {
  active: false,
};

export class Gw2MeClient {
  #client_id: string;
  #client_secret?: string;

  #fedCM;

  constructor({ client_id, client_secret }: ClientInfo, private options?: Partial<Options>) {
    this.#client_id = client_id;
    this.#client_secret = client_secret;
    this.#fedCM = new Gw2MeFedCM(this.#getUrl('/fed-cm/config.json'), this.#client_id);
  }

  #getUrl(url: string) {
    return new URL(url, this.options?.url || 'https://gw2.me/');
  }

  public getAuthorizationUrl({
    redirect_uri,
    scopes,
    state,
    code_challenge,
    code_challenge_method,
    prompt,
    include_granted_scopes,
    verified_accounts_only,
  }: AuthorizationUrlParams): string {
    const params = new URLSearchParams({
      client_id: this.#client_id,
      response_type: 'code',
      redirect_uri,
      scope: scopes.join(' ')
    });

    if(state) {
      params.append('state', state);
    }

    if(code_challenge && code_challenge_method) {
      params.append('code_challenge', code_challenge);
      params.append('code_challenge_method', code_challenge_method);
    }

    if(prompt) {
      params.append('prompt', prompt);
    }

    if(include_granted_scopes) {
      params.append('include_granted_scopes', 'true');
    }

    if(verified_accounts_only) {
      params.append('verified_accounts_only', 'true');
    }

    return this.#getUrl(`/oauth2/authorize?${params.toString()}`).toString();
  }

  async getAccessToken({ code, redirect_uri, code_verifier }: AuthTokenParams): Promise<TokenResponse> {
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code, client_id: this.#client_id, redirect_uri,
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if(this.#client_secret) {
      headers.Authorization = `Basic ${btoa(`${this.#client_id}:${this.#client_secret}`)}`;
    }

    if(code_verifier) {
      data.set('code_verifier', code_verifier);
    }

    const token = await fetch(this.#getUrl('/api/token'), {
      method: 'POST',
      headers,
      body: data,
      cache: 'no-store'
    }).then(jsonOrError);

    return token;
  }

  async refreshToken({ refresh_token }: RefreshTokenParams): Promise<TokenResponse> {
    if(!this.#client_secret) {
      throw new Gw2MeError('client_secret required');
    }

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token, client_id: this.#client_id,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${this.#client_id}:${this.#client_secret}`)}`
    };

    const token = await fetch(this.#getUrl('/api/token'), {
      method: 'POST',
      headers,
      body: data,
      cache: 'no-store',
    }).then(jsonOrError);

    return token;
  }

  async revokeToken({ token }: RevokeTokenParams): Promise<void> {
    const body = new URLSearchParams({ token });

    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if(this.#client_secret) {
      headers.Authorization = `Basic ${btoa(`${this.#client_id}:${this.#client_secret}`)}`;
    }

    await fetch(this.#getUrl('/api/token/revoke'), {
      method: 'POST',
      cache: 'no-store',
      headers,
      body,
    }).then(jsonOrError);
  }

  async introspectToken({ token }: IntrospectTokenParams): Promise<IntrospectTokenResponse> {
    const body = new URLSearchParams({ token });

    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if(this.#client_secret) {
      headers.Authorization = `Basic ${btoa(`${this.#client_id}:${this.#client_secret}`)}`;
    }

    const response = await fetch(this.#getUrl('/api/token/introspect'), {
      method: 'POST',
      cache: 'no-store',
      headers,
      body,
    }).then(jsonOrError);

    return response;
  }

  /**
   * Parses the search params received from gw2.me on the redirect url (code and state).
   * If gw2.me returned an error response, this will throw an error.
   *
   * @returns The code and optional state.
   */
  parseAuthorizationResponseSearchParams(searchParams: URLSearchParams): { code: string, state: string | undefined } {
    // make sure searchParams have iss set (see RFC 9207)
    const expectedIssuer = this.#getUrl('/').origin;
    const receivedIssuer = searchParams.get('iss');

    if(!receivedIssuer) {
      throw new Gw2MeError('Issuer Identifier verification failed: parameter `iss` is missing');
    }

    if(receivedIssuer !== expectedIssuer) {
      throw new Gw2MeError(`Issuer Identifier verification failed: expected "${expectedIssuer}", got "${receivedIssuer}"`);
    }

    // check if `error` (and `error_description`/`error_uri` are set)
    const error = searchParams.get('error');
    if(error) {
      const error_description = searchParams.get('error_description') ?? undefined;
      const error_uri = searchParams.get('error_uri') ?? undefined;

      throw new Gw2MeOAuthError(error, error_description, error_uri);
    }

    // get the code
    const code = searchParams.get('code');
    if(!code) {
      throw new Gw2MeError('Parameter `code` is missing');
    }

    // get state if set
    const state = searchParams.get('state') || undefined;

    return { code, state };
  }

  api(access_token: string) {
    return new Gw2MeApi(access_token, this.options);
  }

  get fedCM() {
    return this.#fedCM;
  }
}
