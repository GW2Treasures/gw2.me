import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { getFormDataString } from '@/lib/form-data';
import { corsHeaders } from '@/lib/cors-header';
import { Authorization, AuthorizationRequestType, AuthorizationType } from '@gw2me/database';
import { db } from '@/lib/db';
import { generateCode } from '@/lib/token';
import { expiresAt } from '@/lib/date';
import { Scope } from '@gw2me/client';
import { normalizeScopes } from 'app/(authorize)/oauth2/authorize/validate';
import { createAuthorizationRequest } from 'app/(authorize)/authorize/helper';
import { getUrlFromRequest } from '@/lib/url';
import { PKCEChallenge } from '@gw2me/client/pkce';

export async function POST(request: NextRequest) {
  // verify `Sec-Fetch-Dest: webidentity` header is set
  if(request.headers.get('Sec-Fetch-Dest') !== 'webidentity') {
    console.error('[fed-cm/assert] Sec-Fetch-Dest invalid');
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'Missing `Sec-Fetch-Dest: webidentity` header' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // get user session
  const user = await getUser();

  if(!user) {
    console.error('[fed-cm/assert] no session');
    return Response.json(
      { error: { code: OAuth2ErrorCode.access_denied, details: 'no session' }},
      { status: 401, headers: corsHeaders(request) }
    );
  }

  // get data from request
  const formData = await request.formData();

  console.log('[fed-cm/assert] request', formData);

  const clientId = getFormDataString(formData, 'client_id');
  const accountId = getFormDataString(formData, 'account_id');
  const nonce = getFormDataString(formData, 'nonce');
  const disclosureShownFor: ('name' | 'email' | 'picture')[] = getFormDataString(formData, 'disclosure_shown_for')?.split(',')
    ?? getFormDataString(formData, 'disclosure_text_shown') === 'true' ? ['name', 'email', 'picture'] : [];
  const params = parseParams(getFormDataString(formData, 'params'));
  const origin = request.headers.get('Origin');

  if(!clientId || !accountId || accountId !== user.id || !origin) {
    console.error('[fed-cm/assert] invalid request');
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'missing required fields' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // parse PKCE
  const pkce = parsePKCE(params, nonce);

  // require PKCE
  // TODO: once PAR is supported, instead of requiring PKCE, the PAR request URL could be used instead?
  if(!pkce) {
    console.error('[fed-cm/assert] invalid request (Missing PKCE)');
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'PKCE is required' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // verify code_challenge_method
  if(!isValidPKCE(pkce)) {
    console.error('[fed-cm/assert] invalid request (Invalid PKCE method)');
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'Invalid PKCE method' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // load application
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, applicationId: true, callbackUrls: true }
  });

  // check that application exists
  if(!client) {
    console.error('[fed-cm/assert] invalid client');
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_client, details: 'invalid client_id' }},
      { status: 404, headers: corsHeaders(request) }
    );
  }

  // verify origin matches a registered callback url
  const validOrigin = client.callbackUrls.some((url) => new URL(url).origin === origin);
  if(!validOrigin) {
    console.error('[fed-cm/assert] invalid origin');
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'wrong origin' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // load application grant
  const applicationGrantIdentifier = {
    userId_applicationId: { userId: user.id, applicationId: client.applicationId }
  };
  const applicationGrant = await db.applicationGrant.findUnique({
    where: applicationGrantIdentifier,
    select: { scope: true, emailId: true, accounts: { select: { id: true }}}
  });

  // get previously authorized scopes
  const previousScopes = new Set(applicationGrant?.scope as Scope[]);

  // get requested scopes if params.scopes is set, otherwise default to Identify+Email
  const requestedScopes = new Set(params.scope?.split(' ') as Scope[] ?? [Scope.Identify, Scope.Email]);
  normalizeScopes(requestedScopes);

  // always include previous scopes if available (as if `include_granted_scopes` is set during OAuth authorization)
  // TODO: this could be made configurable (params)
  const scopes = previousScopes.union(requestedScopes);

  // get new scopes
  const undisclosedNewScopes = scopes.difference(previousScopes);

  // iterate over disclosed fields and remove corresponding scopes from undisclosed set
  for(const disclosure of disclosureShownFor) {
    if(disclosure === 'email') {
      undisclosedNewScopes.delete(Scope.Email);
    }
    if(disclosure === 'name') {
      undisclosedNewScopes.delete(Scope.Identify);
    }
  }

  // make sure all scopes were either previously authorized or disclosed
  if(undisclosedNewScopes.size > 0) {
    console.warn('[fed-cm/assert] undisclosed scopes', undisclosedNewScopes);

    // the user needs to authorize the additional scopes, create an authorization request
    // TODO: always create authorization request, even if the request is instantly authorized
    const authorizationRequest = await createAuthorizationRequest(AuthorizationRequestType.FedCM, {
      client_id: clientId,
      response_type: 'code',
      scope: Array.from(scopes).join(' '),
      include_granted_scopes: 'true',
      ...pkce,
    });

    // get URL of the authorization request
    const continue_on = new URL(`/authorize/${authorizationRequest.id}`, getUrlFromRequest(request)).toString();

    // return the continue_on URL to the client
    // if the client does not support continue_on, the client will simply show an error
    return NextResponse.json(
      { continue_on },
      { headers: corsHeaders(request) }
    );
  }

  // create code
  let authorization: Authorization;

  try {
    const identifier = {
      type: AuthorizationType.Code,
      clientId,
      userId: user.id
    };

    [,, authorization] = await db.$transaction([
      // delete old pending authorization codes for this app
      db.authorization.deleteMany({ where: identifier }),

      // create or update applicationGrant
      db.applicationGrant.upsert({
        where: applicationGrantIdentifier,
        create: {
          ...applicationGrantIdentifier.userId_applicationId,
          scope: Array.from(scopes),
          accounts: applicationGrant?.accounts ? { connect: applicationGrant.accounts } : undefined,
          emailId: user.defaultEmail?.id,
        },
        update: {
          scope: Array.from(scopes),
          accounts: applicationGrant?.accounts ? { connect: applicationGrant.accounts } : undefined,
          emailId: applicationGrant?.emailId ?? user.defaultEmail?.id,
        }
      }),

      // create code authorization in db
      db.authorization.create({
        data: {
          ...identifier,
          applicationId: client.applicationId,
          scope: Array.from(scopes),
          token: generateCode(),
          expiresAt: expiresAt(60),
          codeChallenge: `${pkce.code_challenge_method}:${pkce.code_challenge}`
        },
      }),
    ]);
  } catch(error) {
    console.error('[fed-cm/assert] error');
    console.error(error);

    return Response.json(
      { error: { code: OAuth2ErrorCode.server_error }},
      { status: 500, headers: corsHeaders(request) }
    );
  }

  const token = authorization.token;

  return NextResponse.json(
    { token },
    { headers: corsHeaders(request) }
  );
}


interface Params {
  scope?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

function parseParams(params?: string): Params {
  if(!params) {
    return {};
  }

  try {
    return JSON.parse(params);
  } catch {
    console.error('Could not parse Fed-CM params as json', params);
  }

  return {};
}

type UnsafePKCEChallenge = {
  code_challenge: string;
  code_challenge_method: string;
};

function parsePKCE(params: Params, nonce: string | undefined): PKCEChallenge | UnsafePKCEChallenge | undefined {
  // get PKCE from params
  if(params.code_challenge && params.code_challenge_method) {
    return { code_challenge: params.code_challenge, code_challenge_method: params.code_challenge_method };
  }

  // if nonce is undefined, we can't fallback to it
  if(!nonce) {
    return undefined;
  }

  // get PKCE from nonce
  const [code_challenge_method, code_challenge] = nonce.split(':');

  if(code_challenge_method && code_challenge) {
    return { code_challenge, code_challenge_method };
  }

  return undefined;
}

function isValidPKCE(pkce: PKCEChallenge | UnsafePKCEChallenge): pkce is PKCEChallenge {
  return pkce.code_challenge_method === 'S256';
}
