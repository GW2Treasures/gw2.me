export enum Scope {
  Identify = 'identify',
  Email = 'email',

  GW2_Account = 'gw2:account',
  GW2_Inventories = 'gw2:inventories',
  GW2_Characters = 'gw2:characters',
  GW2_Tradingpost = 'gw2:tradingpost',
  GW2_Wallet = 'gw2:wallet',
  GW2_Unlocks = 'gw2:unlocks',
  GW2_Pvp = 'gw2:pvp',
  GW2_Builds = 'gw2:builds',
  GW2_Progression = 'gw2:progression',
  GW2_Guilds = 'gw2:guilds',
}

export interface AuthorizationUrlParams {
  redirect_uri: string;
  client_id: string;
  scopes: Scope[];
  state?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256';
  prompt?: 'none' | 'consent'
  include_granted_scopes?: boolean;
}

function getUrl() {
  return process.env.GW2ME_URL || 'https://gw2.me/';
}

export function getAuthorizationUrl({
  redirect_uri,
  client_id,
  scopes,
  state,
  code_challenge,
  code_challenge_method,
  prompt,
  include_granted_scopes
}: AuthorizationUrlParams) {
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

  return `${getUrl()}oauth2/authorize?${params.toString()}`;
}

export interface AuthTokenParams {
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret?: string;
  code_verifier?: string;
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
  refresh_token?: string,
  scope: string,
}

export async function getAccessToken({ code, client_id, client_secret, redirect_uri, code_verifier }: AuthTokenParams): Promise<TokenResponse> {
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code, client_id, redirect_uri,
  });

  if(client_secret) {
    data.set('client_secret', client_secret);
  }

  if(code_verifier) {
    data.set('code_verifier', code_verifier);
  }

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

export const rest = {
  user({ access_token }: { access_token: string }): Promise<UserResponse> {
    return fetch(`${getUrl()}api/user`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
      cache: 'no-store',
    }).then((r) => r.json());
  },

  accounts({ access_token }: { access_token: string }): Promise<AccountsResponse> {
    return fetch(`${getUrl()}api/accounts`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
      cache: 'no-store',
    }).then((r) => r.json());
  },

  subtoken({ access_token, accountId }: { access_token: string, accountId: string }): Promise<SubtokenResponse> {
    return fetch(`${getUrl()}api/accounts/${accountId}/subtoken`, {
      headers: { 'Authorization': `Bearer ${access_token}` },
      cache: 'no-store',
    }).then((r) => r.json());
  },
};
