import { Gw2MeApi } from './api';
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

    if(this.#client_secret) {
      data.set('client_secret', this.#client_secret);
    }

    if(code_verifier) {
      data.set('code_verifier', code_verifier);
    }

    const token = await fetch(this.#getUrl('/api/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data,
      cache: 'no-store'
    }).then(jsonOrError);

    return token;
  }

  async refreshToken({ refresh_token }: RefreshTokenParams): Promise<TokenResponse> {
    if(!this.#client_secret) {
      throw new Error('client_secret required');
    }

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token, client_id: this.#client_id, client_secret: this.#client_secret,
    });

    const token = await fetch(this.#getUrl('/api/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data,
      cache: 'no-store',
    }).then(jsonOrError);

    return token;
  }

  api(access_token: string) {
    return new Gw2MeApi(access_token, this.options);
  }

  get fedCM() {
    return this.#fedCM;
  }
}
