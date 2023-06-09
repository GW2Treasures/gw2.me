export enum Scope {
  Identify = 'identify',
  Email = 'email',
}

export interface AuthorizationUrlParams {
  redirect_uri: string;
  client_id: string;
  scopes: Scope[];
  state?: string;
}

function getUrl() {
  return process.env.GW2ME_URL || 'https://gw2.me/';
}

export function getAuthorizationUrl({ redirect_uri, client_id, scopes, state }: AuthorizationUrlParams) {
  /* eslint-disable object-shorthand */
  const params = new URLSearchParams({
    'response_type': 'code',
    'redirect_uri': redirect_uri,
    'client_id': client_id,
    'scope': scopes.join(' ')
  });
  /* eslint-enable */

  if(state) {
    params.append('state', state);
  }

  return `${getUrl()}oauth2/authorize?${params.toString()}`;
}

export interface AuthTokenParams {
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
}

export interface RefreshTokenParams {
  refresh_token: string;
  client_id: string;
  client_secret: string;
}

export interface TokenResponse {
  access_token: string,
  token_type: 'Bearer',
  expires_in: number,
  refresh_token: string,
  scope: string,
}

export async function getAccessToken({ code, client_id, client_secret, redirect_uri }: AuthTokenParams): Promise<TokenResponse> {
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code, client_id, client_secret, redirect_uri,
  });

  // get discord token
  const token = await fetch(`${getUrl()}api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data,
    cache: 'no-store'
  }).then((r) => r.json());

  return token;
}

export async function refreshToken({ refresh_token, client_id, client_secret }: RefreshTokenParams): Promise<TokenResponse> {
  const data = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token, client_id, client_secret,
  });

  // get discord token
  const token = await fetch(`${getUrl()}api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data,
    cache: 'no-store',
  }).then((r) => r.json());

  return token;
}

export interface UserResponse {
  user: {
    id: string;
    name: string;
    email?: string;
  }
}

export const rest = {
  user({ access_token }: { access_token: string }): Promise<UserResponse> {
    return fetch(`${getUrl()}api/user`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
      cache: 'no-store',
    }).then((r) => r.json());
  }
};
