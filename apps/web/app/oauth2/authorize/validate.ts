import { db } from '@/lib/db';
import { Scope } from '@gw2me/api';

export interface AuthorizeRequestParams {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  scope: string;
  state?: string;
}

export async function validateRequest(params: AuthorizeRequestParams): Promise<{ error: string, application?: undefined } | { error: undefined, application: { id: string, name: string }, scopes: Scope[], redirect_uri: URL }> {
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

  const scopes = decodeURIComponent(params.scope).split(' ');

  if(!params.scope || !validScopes(scopes)) {
    return { error: 'Invalid scope' };
  }

  const application = await db.application.findUnique({
    where: { clientId: params.client_id },
    select: { id: true, name: true, callbackUrls: true }
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

  return { error: undefined, application, scopes, redirect_uri };
}

function validScopes(scopes: string[]): scopes is Scope[] {
  const validScopes: string[] = Object.values(Scope);
  return scopes.every((scope) => validScopes.includes(scope));
}

export function hasGW2Scopes(scopes: Scope[]): boolean {
  return scopes.some((scope) => scope.startsWith('gw2:'));
}
