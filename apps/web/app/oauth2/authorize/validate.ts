import { db } from '@/lib/db';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { assert, fail, tryOrFail } from '@/lib/oauth/assert';
import { Scope } from '@gw2me/client';
import { ApplicationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createRedirectUrl } from '@/lib/redirectUrl';

export interface AuthorizeRequestParams {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  scope: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  prompt?: string;
  include_granted_scopes?: string;
  verified_accounts_only?: string;
}

export const getApplicationByClientId = cache(async function getApplicationByClientId(clientId: string | undefined) {
  assert(clientId, OAuth2ErrorCode.invalid_request, 'client_id is missing');

  const application = await db.application.findUnique({
    where: { clientId },
    select: { id: true, name: true, callbackUrls: true, type: true, imageId: true, owner: { select: { name: true }}}
  });

  assert(application, OAuth2ErrorCode.invalid_request, 'invalid client_id');

  return application;
});

async function verifyClientId({ client_id }: Partial<AuthorizeRequestParams>) {
  await getApplicationByClientId(client_id);
}

/** @see https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2 */
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

/** @see https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.1 */
function verifyResponseType({ response_type }: Partial<AuthorizeRequestParams>) {
  const supportedResponseTypes = ['code'];

  assert(response_type, OAuth2ErrorCode.invalid_request, 'missing response_type');
  assert(supportedResponseTypes.includes(response_type), OAuth2ErrorCode.unsupported_response_type, 'response_type is unsupported');
}

/** @see https://datatracker.ietf.org/doc/html/rfc6749#section-3.3 */
function verifyScopes({ scope }: Partial<AuthorizeRequestParams>) {
  assert(scope, OAuth2ErrorCode.invalid_request, 'missing scopes');

  const validScopes: string[] = Object.values(Scope);
  const scopes = decodeURIComponent(scope).split(' ');

  if(!scopes.every((scope) => validScopes.includes(scope))) {
    throw new OAuth2Error(OAuth2ErrorCode.invalid_scope, { description: 'invalid scope' });
  }
}

/** @see https://datatracker.ietf.org/doc/html/rfc7636#section-4.3 */
async function verifyPKCE({ client_id, code_challenge, code_challenge_method }: Partial<AuthorizeRequestParams>) {
  const supportedAlgorithms = ['S256'];

  const hasPKCE = !!code_challenge || !!code_challenge_method;

  fail(hasPKCE && !code_challenge_method, OAuth2ErrorCode.invalid_request, 'missing code_challenge_method');
  fail(hasPKCE && !code_challenge, OAuth2ErrorCode.invalid_request, 'missing code_challenge');
  fail(code_challenge_method && !supportedAlgorithms.includes(code_challenge_method), OAuth2ErrorCode.invalid_request, 'unsupported code_challenge_metod');

  const application = await getApplicationByClientId(client_id);

  fail(application.type === ApplicationType.Public && !hasPKCE, OAuth2ErrorCode.invalid_request, 'PKCE is required for public clients');
}

function verifyIncludeGrantedScopes({ include_granted_scopes }: Partial<AuthorizeRequestParams>) {
  assert(include_granted_scopes === undefined || include_granted_scopes === 'true', OAuth2ErrorCode.invalid_request, 'invalid include_granted_scopes');
}

function verifyPrompt({ prompt }: Partial<AuthorizeRequestParams>) {
  assert([undefined, 'none', 'consent'].includes(prompt), OAuth2ErrorCode.invalid_request, 'invalid prompt');
}

function verifyVerifiedAccountsOnly({ verified_accounts_only }: Partial<AuthorizeRequestParams>) {
  assert(verified_accounts_only === undefined || verified_accounts_only === 'true', OAuth2ErrorCode.invalid_request, 'invalid verified_accounts_only');
}

export const validateRequest = cache(async function validateRequest(request: Partial<AuthorizeRequestParams>): Promise<{ error: string, request?: undefined } | { error: undefined, request: AuthorizeRequestParams }> {
  try {
    // first verify client_id and redirect_uri
    await verifyClientId(request);
    await verifyRedirectUri(request);
  } catch(error) {
    if(error instanceof OAuth2Error) {
      // it is not safe to redirect back to the client, so we show an error
      console.log(error);
      return { error: error.message };
    }

    console.log(error);
    return { error: 'Unknown error' };
  }

  try {
    await Promise.all([
      verifyResponseType(request),
      verifyScopes(request),
      verifyPKCE(request),
      verifyPrompt(request),
      verifyIncludeGrantedScopes(request),
      verifyVerifiedAccountsOnly(request),
    ]);

    return { error: undefined, request: request as AuthorizeRequestParams };
  } catch(error) {
    let redirect_uri: URL;

    if(error instanceof OAuth2Error) {
      redirect_uri = createRedirectUrl(request.redirect_uri!, {
        state: request.state,
        error: error.code,
        error_description: error.description
      });
    } else {
      console.log(error);

      redirect_uri = createRedirectUrl(request.redirect_uri!, {
        state: request.state,
        error: OAuth2ErrorCode.server_error,
        error_description: 'internal server error'
      });
    }

    redirect(redirect_uri.toString());
  }
});
