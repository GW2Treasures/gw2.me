import { Gw2MeApi, type ApiOptions } from './api';
import { createDPoPJwt } from './dpop';
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
  dpop_jkt?: string;
  prompt?: 'none' | 'consent'
  include_granted_scopes?: boolean;
  verified_accounts_only?: boolean;
}

export interface AuthorizationUrlRequestUriParams {
  request_uri: string
}

export interface AuthTokenParams {
  code: string;
  token_type?: 'Bearer' | 'DPoP';
  redirect_uri: string;
  code_verifier?: string;
  dpopKeyPair?: CryptoKeyPair;
}

export interface RefreshTokenParams {
  refresh_token: string,
  dpopKeyPair?: CryptoKeyPair,
}

export interface TokenResponse {
  access_token: string,
  issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
  token_type: 'Bearer' | 'DPoP',
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

export interface PushedAuthorizationRequestResponse {
  request_uri: string,
  expires_in: number,
}

export class Gw2MeClient {
  #client: ClientInfo;
  #fedCM;

  constructor(client: ClientInfo, private options?: Partial<Options>) {
    this.#client = client;
    this.#fedCM = new Gw2MeFedCM(this.#getUrl('/fed-cm/config.json'), client.client_id);
  }

  #getUrl(url: string) {
    return new URL(url, this.options?.url || 'https://gw2.me/');
  }

  #getAuthorizationHeader() {
    if(this.#client.type === 'Public') {
      throw new Gw2MeError('Confidential client expected');
    }

    if(!this.#client.client_secret) {
      throw new Gw2MeError('client_secret is required');
    }

    return `Basic ${btoa(`${this.#client.client_id}:${this.#client.client_secret}`)}`;
  }

  public getAuthorizationUrl(params: AuthorizationUrlParams | AuthorizationUrlRequestUriParams): string {
    const urlParams = 'request_uri' in params
      ? new URLSearchParams({
        client_id: this.#client.client_id,
        response_type: 'code',
        request_uri: params.request_uri
      })
      : constructAuthorizationParams(this.#client.client_id, params);

    return this.#getUrl(`/oauth2/authorize?${urlParams.toString()}`).toString();
  }

  public async pushAuthorizationRequest(params: AuthorizationUrlParams): Promise<PushedAuthorizationRequestResponse> {
    const urlParams = constructAuthorizationParams(this.#client.client_id, params);
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if(this.#client.type === 'Confidential') {
      headers.Authorization = this.#getAuthorizationHeader();
    }

    const response: PushedAuthorizationRequestResponse = await fetch(this.#getUrl('/oauth2/par'), {
      method: 'POST',
      headers,
      body: urlParams,
      cache: 'no-store',
    }).then(jsonOrError);

    return response;
  }

  async getAccessToken({ code, token_type, redirect_uri, code_verifier, dpopKeyPair }: AuthTokenParams): Promise<TokenResponse> {
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code, client_id: this.#client.client_id, redirect_uri,
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if(this.#client.type === 'Confidential') {
      headers.Authorization = this.#getAuthorizationHeader();
    }

    if(code_verifier) {
      data.set('code_verifier', code_verifier);
    }

    const url = this.#getUrl('/api/token');

    if(dpopKeyPair) {
      headers.DPoP = await createDPoPJwt({
        htm: 'POST',
        htu: url.toString(),
        accessToken: token_type === 'DPoP' ? code : undefined,
      }, dpopKeyPair);
    }

    const token = await fetch(url, {
      method: 'POST',
      headers,
      body: data,
      cache: 'no-store'
    }).then(jsonOrError);

    return token;
  }

  async refreshToken({ refresh_token, dpopKeyPair }: RefreshTokenParams): Promise<TokenResponse> {
    // TODO(dpop): Allow public clients if used with dpop
    if(this.#client.type === 'Public') {
      throw new Gw2MeError('Only confidential clients can use refresh tokens.');
    }

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token, client_id: this.#client.client_id,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': this.#getAuthorizationHeader(),
    };

    const url = this.#getUrl('/api/token');

    if(dpopKeyPair) {
      headers.DPoP = await createDPoPJwt({
        htm: 'POST',
        htu: url.toString(),
        // public clients have their refresh token DPoP bound, confidential clients not, as the secret is used proof of possession
        accessToken: this.#client.type === 'Confidential' ? undefined : refresh_token,
      }, dpopKeyPair);
    }

    const token = await fetch(url, {
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

    if(this.#client.type === 'Confidential') {
      headers.Authorization = this.#getAuthorizationHeader();
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

    if(this.#client.type === 'Confidential') {
      headers.Authorization = this.#getAuthorizationHeader();
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

  api(access_token: string, options?: Partial<Omit<ApiOptions, keyof Options>>) {
    return new Gw2MeApi(access_token, { ...this.options, ...options });
  }

  get fedCM() {
    return this.#fedCM;
  }
}

function constructAuthorizationParams(client_id: string, {
  redirect_uri,
  scopes,
  state,
  code_challenge,
  code_challenge_method,
  dpop_jkt,
  prompt,
  include_granted_scopes,
  verified_accounts_only,
}: AuthorizationUrlParams) {
  const params = new URLSearchParams({
    client_id,
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

  if(dpop_jkt) {
    params.append('dpop_jkt', dpop_jkt);
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

  return params;
}
