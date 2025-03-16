import { db } from '@/lib/db';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { assert, fail, tryOrFail } from '@/lib/oauth/assert';
import { Scope } from '@gw2me/client';
import { ClientType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createRedirectUrl } from '@/lib/redirectUrl';
import type { AuthorizationRequestData } from 'app/(authorize)/authorize/types';

export const getApplicationByClientId = cache(async function getApplicationByClientId(clientId: string | undefined) {
  assert(clientId, OAuth2ErrorCode.invalid_request, 'client_id is missing');

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: {
      callbackUrls: true,
      type: true,
      application: {
        select: {
          id: true,
          name: true,
          privacyPolicyUrl: true,
          termsOfServiceUrl: true,
          imageId: true,
          owner: { select: { name: true }}
        }
      }
    }
  });

  assert(client, OAuth2ErrorCode.invalid_request, 'invalid client_id');

  return client;
});

async function verifyClientId({ client_id }: Partial<AuthorizationRequestData.OAuth2>) {
  await getApplicationByClientId(client_id);
}

/** @see https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2 */
async function verifyRedirectUri({ client_id, redirect_uri }: Partial<AuthorizationRequestData.OAuth2>) {
  assert(redirect_uri, OAuth2ErrorCode.invalid_request, 'redirect_uri is missing');

  const url = tryOrFail(() => new URL(redirect_uri), OAuth2ErrorCode.invalid_request, 'invalid redirect_uri');

  const client = await getApplicationByClientId(client_id);

  // ignore port for loopback ips (see https://datatracker.ietf.org/doc/html/rfc8252#section-7.3)
  if(url.hostname === '127.0.0.1' || url.hostname === '[::1]') {
    url.port = '';
  }

  assert(client.callbackUrls.includes(url.toString()), OAuth2ErrorCode.invalid_request, 'unregistered redirect_uri');
}

/** @see https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.1 */
function verifyResponseType({ response_type }: Partial<AuthorizationRequestData.OAuth2>) {
  const supportedResponseTypes = ['code'];

  assert(response_type, OAuth2ErrorCode.invalid_request, 'missing response_type');
  assert(supportedResponseTypes.includes(response_type), OAuth2ErrorCode.unsupported_response_type, 'response_type is unsupported');
}

/** @see https://datatracker.ietf.org/doc/html/rfc6749#section-3.3 */
function verifyScopes({ scope }: Partial<AuthorizationRequestData.OAuth2>) {
  assert(scope, OAuth2ErrorCode.invalid_request, 'missing scopes');

  const validScopes: string[] = Object.values(Scope);
  const scopes = decodeURIComponent(scope).split(' ');

  if(!scopes.every((scope) => validScopes.includes(scope))) {
    throw new OAuth2Error(OAuth2ErrorCode.invalid_scope, { description: 'invalid scope' });
  }
}

/** @see https://datatracker.ietf.org/doc/html/rfc7636#section-4.3 */
async function verifyPKCE({ client_id, code_challenge, code_challenge_method }: Partial<AuthorizationRequestData.OAuth2>) {
  const supportedAlgorithms = ['S256'];

  const hasPKCE = !!code_challenge || !!code_challenge_method;

  fail(hasPKCE && !code_challenge_method, OAuth2ErrorCode.invalid_request, 'missing code_challenge_method');
  fail(hasPKCE && !code_challenge, OAuth2ErrorCode.invalid_request, 'missing code_challenge');
  fail(code_challenge_method && !supportedAlgorithms.includes(code_challenge_method), OAuth2ErrorCode.invalid_request, 'unsupported code_challenge_metod');

  const client = await getApplicationByClientId(client_id);

  fail(client.type === ClientType.Public && !hasPKCE, OAuth2ErrorCode.invalid_request, 'PKCE is required for public clients');
}

function verifyIncludeGrantedScopes({ include_granted_scopes }: Partial<AuthorizationRequestData.OAuth2>) {
  assert(include_granted_scopes === undefined || include_granted_scopes === 'true', OAuth2ErrorCode.invalid_request, 'invalid include_granted_scopes');
}

function verifyPrompt({ prompt }: Partial<AuthorizationRequestData.OAuth2>) {
  assert([undefined, 'none', 'consent'].includes(prompt), OAuth2ErrorCode.invalid_request, 'invalid prompt');
}

function verifyVerifiedAccountsOnly({ verified_accounts_only }: Partial<AuthorizationRequestData.OAuth2>) {
  assert(verified_accounts_only === undefined || verified_accounts_only === 'true', OAuth2ErrorCode.invalid_request, 'invalid verified_accounts_only');
}

export const validateRequest = cache(async function validateRequest(request: Partial<AuthorizationRequestData.OAuth2>): Promise<{ error: string, request?: undefined } | { error: undefined, request: AuthorizationRequestData.OAuth2 }> {
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

    return { error: undefined, request: request as AuthorizationRequestData.OAuth2 };
  } catch(error) {
    let redirect_uri: URL;

    if(error instanceof OAuth2Error) {
      redirect_uri = await createRedirectUrl(request.redirect_uri!, {
        state: request.state,
        error: error.code,
        error_description: error.description
      });
    } else {
      console.log(error);

      redirect_uri = await createRedirectUrl(request.redirect_uri!, {
        state: request.state,
        error: OAuth2ErrorCode.server_error,
        error_description: 'internal server error'
      });
    }

    redirect(redirect_uri.toString());
  }
});


const gw2Scopes = Object.values(Scope).filter((scope) => scope.startsWith('gw2:'));
export function normalizeScopes(scopes: Set<Scope>): void {
  // include `accounts` if any gw2 or sub scope is included
  if(gw2Scopes.some((scope) => scopes.has(scope)) || scopes.has(Scope.Accounts_DisplayName) || scopes.has(Scope.Accounts_Verified)) {
    scopes.add(Scope.Accounts);
  }
}
