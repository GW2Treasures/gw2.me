import { db } from '@/lib/db';
import { Scope } from '@gw2me/client';
import { ApplicationType } from '@gw2me/database';

export interface AuthorizeRequestParams {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  scope: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export async function validateRequest(params: AuthorizeRequestParams): Promise<{ error: string, application?: undefined } | { error: undefined, application: { id: string, name: string }, scopes: Scope[], redirect_uri: URL, codeChallenge?: string }> {
  const supportedResponseTypes = ['code'];

  if(!params.response_type || !supportedResponseTypes.includes(params.response_type)) {
    return { error: 'Invalid response_type' };
  }

  if(!params.redirect_uri) {
    return { error: 'Invalid redirect_uri' };
  }

  let redirect_uri;
  try {
    redirect_uri = new URL(params.redirect_uri);
  } catch {
    return { error: 'Invalid redirect_uri' };
  }

  if(!params.client_id) {
    return { error: 'Invalid client_id' };
  }

  if(params.code_challenge_method && !validCodeChallengeMethod(params.code_challenge_method)) {
    return { error: 'Invalid code_challenge_method' };
  }

  if(!!params.code_challenge !== !!params.code_challenge_method) {
    return { error: 'Invalid code_challenge or code_challenge_method' };
  }

  const scopes = decodeURIComponent(params.scope).split(' ');

  if(!params.scope || !validScopes(scopes)) {
    return { error: 'Invalid scope' };
  }

  const application = await db.application.findUnique({
    where: { clientId: params.client_id },
    select: { id: true, name: true, callbackUrls: true, type: true }
  });

  if(!application) {
    return { error: 'Invalid client_id' };
  }

  // ignore port for loopback ips (see https://datatracker.ietf.org/doc/html/rfc8252#section-7.3)
  const redirect_uri_normalized = new URL(redirect_uri);
  if(redirect_uri_normalized.hostname === '127.0.0.1' || redirect_uri_normalized.hostname === '[::1]') {
    redirect_uri_normalized.port = '';
  }

  if(!application.callbackUrls.includes(redirect_uri_normalized.toString())) {
    return { error: 'Invalid redirect_uri' };
  }

  const hasPKCE = params.code_challenge && params.code_challenge_method;

  if(application.type === ApplicationType.Public && !hasPKCE) {
    return { error: 'PKCE required' };
  }

  const codeChallenge = hasPKCE
    ? `${params.code_challenge_method}:${params.code_challenge}`
    : undefined;

  return { error: undefined, application, scopes, redirect_uri, codeChallenge };
}

function validScopes(scopes: string[]): scopes is Scope[] {
  const validScopes: string[] = Object.values(Scope);
  return scopes.every((scope) => validScopes.includes(scope));
}

export function hasGW2Scopes(scopes: Scope[]): boolean {
  return scopes.some((scope) => scope.startsWith('gw2:'));
}

function validCodeChallengeMethod(method: string): method is 'S256' {
  return method === 'S256';
}
