import { db } from '@/lib/db';
import { OAuth2Error, OAuth2ErrorCode, assert, fail, tryOrFail } from '@/lib/oauth2Error';
import { Scope } from '@gw2me/client';
import { ApplicationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export interface AuthorizeRequestParams {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  scope: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export const getApplicationByClientId = cache(async function getApplicationByClientId(clientId: string | undefined) {
  console.log('> Load application', clientId);
  assert(clientId, OAuth2ErrorCode.invalid_request, 'client_id is missing');

  const application = await db.application.findUnique({
    where: { clientId },
    select: { id: true, name: true, callbackUrls: true, type: true }
  });

  assert(application, OAuth2ErrorCode.invalid_request, 'invalid client_id');

  return application;
});

function verifyResponseType({ response_type }: Partial<AuthorizeRequestParams>) {
  const supportedResponseTypes = ['code'];

  assert(response_type, OAuth2ErrorCode.invalid_request, 'missing response_type');
  assert(supportedResponseTypes.includes(response_type), OAuth2ErrorCode.unsupported_response_type, 'response_type is unsupported');
}

async function verifyClientId({ client_id }: Partial<AuthorizeRequestParams>) {
  await getApplicationByClientId(client_id);
}

async function verifyRedirectUri({ client_id, redirect_uri }: Partial<AuthorizeRequestParams>) {
  assert(redirect_uri, OAuth2ErrorCode.invalid_request, 'redirect_uri is missing');

  const url = tryOrFail(() => new URL(redirect_uri), OAuth2ErrorCode.invalid_request, 'invalid redirect_uri');

  const application = await getApplicationByClientId(client_id);

  // ignore port for loopback ips (see https://datatracker.ietf.org/doc/html/rfc8252#section-7.3)
  if(url.hostname === '127.0.0.1' || url.hostname === '[::1]') {
    url.port = '';
  }

  assert(application.callbackUrls.includes(url.toString()), OAuth2ErrorCode.invalid_request, 'unregistered redirect_uri');
}

function verifyScopes({ scope }: Partial<AuthorizeRequestParams>) {
  assert(scope, OAuth2ErrorCode.invalid_request, 'missing scopes');

  const validScopes: string[] = Object.values(Scope);
  const scopes = decodeURIComponent(scope).split(' ');

  if(!scopes.every((scope) => validScopes.includes(scope))) {
    throw new OAuth2Error(OAuth2ErrorCode.invalid_scope, { description: 'invalid scope' });
  }
}

async function verifyPKCE({ client_id, code_challenge, code_challenge_method }: Partial<AuthorizeRequestParams>) {
  const supportedAlgorithms = ['S256'];

  const hasPKCE = !!code_challenge || !!code_challenge_method;

  fail(hasPKCE && !code_challenge_method, OAuth2ErrorCode.invalid_request, 'missing code_challenge_method');
  fail(hasPKCE && !code_challenge, OAuth2ErrorCode.invalid_request, 'missing code_challenge');
  fail(code_challenge_method && !supportedAlgorithms.includes(code_challenge_method), OAuth2ErrorCode.invalid_request, 'unsupported code_challenge_metod');

  const application = await getApplicationByClientId(client_id);

  fail(application.type === ApplicationType.Public && !hasPKCE, OAuth2ErrorCode.invalid_request, 'PKCE is required for public clients');
}

export async function validateRequest(params: Partial<AuthorizeRequestParams>): Promise<{ error: string | undefined }> {
  try {
    // first verify client_id and redirect_uri
    await verifyClientId(params);
    await verifyRedirectUri(params);
  } catch(error) {
    if(error instanceof OAuth2Error) {
      // it is not safe to redirect back to the client, so we show an error
      return { error: error.message };
    }

    console.log(error);
    return { error: 'Unknown error' };
  }

  try {
    await Promise.all([
      verifyResponseType(params),
      verifyScopes(params),
      verifyPKCE(params),
    ]);

    return { error: undefined };
  } catch(error) {
    const redirect_uri = new URL(params.redirect_uri!);
    params.state && redirect_uri.searchParams.set('state', params.state);

    if(error instanceof OAuth2Error) {
      redirect_uri.searchParams.set('error', error.code);
      error.description && redirect_uri.searchParams.set('error_description', error.description);
    } else {
      console.log(error);

      redirect_uri.searchParams.set('error', OAuth2ErrorCode.server_error);
      redirect_uri.searchParams.set('error_description', 'internal server error');
    }

    redirect(redirect_uri.toString());
  }
}

export function hasGW2Scopes(scopes: Scope[]): boolean {
  return scopes.some((scope) => scope.startsWith('gw2:'));
}
