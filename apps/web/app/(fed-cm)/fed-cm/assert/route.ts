import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { corsHeaders } from '@/lib/cors-header';
import { AuthorizationRequestType, AuthorizationType, Prisma } from '@gw2me/database';
import { db } from '@/lib/db';
import { generateCode } from '@/lib/token';
import { expiresAt } from '@/lib/date';
import { Scope } from '@gw2me/client';
import { normalizeScopes } from 'app/(authorize)/oauth2/authorize/validate';
import { createAuthorizationRequest } from 'app/(authorize)/authorize/helper';
import { getUrlFromRequest } from '@/lib/url';
import { PKCEChallenge } from '@gw2me/client/pkce';
import { AuthorizationRequestData } from 'app/(authorize)/authorize/types';
import { FedCMServerError, IdentityAssertionErrorResponse, IdentityAssertionResponse, isValidWebIdentityRequest, parseIdentityAssertionRequest } from '@fedcm/server';
import { assert } from '@/lib/oauth/assert';

export async function POST(request: NextRequest): Promise<NextResponse<IdentityAssertionResponse>> {
  try {
    // verify `Sec-Fetch-Dest: webidentity` header is set
    assert(isValidWebIdentityRequest(request), OAuth2ErrorCode.invalid_request, 'Missing `Sec-Fetch-Dest: webidentity` header');

    // get user session
    const user = await getUser();
    assert(user, OAuth2ErrorCode.access_denied, { description: 'no session', httpStatus: 401 });

    // get data from request
    const formData = await request.formData();
    console.log('[fed-cm/assert] request', formData);

    // parse request data
    const identityAssertionRequest = parseIdentityAssertionRequest(formData);
    const params = parseParams(identityAssertionRequest.params);

    // verify account id matches user id
    assert(identityAssertionRequest.account_id === user.id, OAuth2ErrorCode.invalid_request, 'Invalid `account_id`');

    // verify origin is configured
    const origin = request.headers.get('Origin');
    assert(origin, OAuth2ErrorCode.invalid_request, '`Origin` header is missing');

    // parse PKCE
    const pkce = parsePKCE(params, identityAssertionRequest.nonce);

    // require PKCE
    // TODO: once PAR is supported, instead of requiring PKCE, the PAR request URL could be used instead?
    assert(pkce, OAuth2ErrorCode.invalid_request, 'PKCE is required');

    // verify code_challenge_method
    assert(isValidPKCE(pkce), OAuth2ErrorCode.invalid_request, 'Invalid PKCE method');

    // load application
    const client = await db.client.findUnique({
      where: { id: identityAssertionRequest.client_id },
      select: { id: true, applicationId: true, callbackUrls: true }
    });

    // check that application exists
    assert(client, OAuth2ErrorCode.invalid_client, { description: 'invalid `client_id`', httpStatus: 404 });

    // verify origin matches a registered callback url
    const validOrigin = client.callbackUrls.some((url) => new URL(url).origin === origin);
    assert(validOrigin, OAuth2ErrorCode.invalid_request, 'invalid origin');

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
    for(const disclosure of (identityAssertionRequest.disclosure_shown_for ?? [])) {
      if(disclosure === 'email') {
        undisclosedNewScopes.delete(Scope.Email);
      }
      if(disclosure === 'name') {
        undisclosedNewScopes.delete(Scope.Identify);
      }
    }

    const authorizationRequestData: AuthorizationRequestData.FedCM = {
      client_id: identityAssertionRequest.client_id,
      response_type: 'code',
      scope: Array.from(scopes).join(' '),
      include_granted_scopes: 'true',
      ...pkce,
    };

    // make sure all scopes were either previously authorized or disclosed
    if(undisclosedNewScopes.size > 0) {
      console.log('[fed-cm/assert] undisclosed scopes', undisclosedNewScopes);

      // the user needs to authorize the additional scopes, create an authorization request
      const authorizationRequest = await createAuthorizationRequest(AuthorizationRequestType.FedCM, authorizationRequestData);

      // get URL of the authorization request
      const continue_on = new URL(`/authorize/${authorizationRequest.id}`, getUrlFromRequest(request));

      // return the continue_on URL to the client
      // if the client does not support continue_on, the client will simply show an error
      return NextResponse.json(
        { continue_on },
        { headers: corsHeaders(request) }
      );
    }

    // create code
    const identifier = {
      type: AuthorizationType.Code,
      clientId: identityAssertionRequest.client_id,
      userId: user.id
    };

    const [,, authorization] = await db.$transaction([
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
          accounts: applicationGrant?.accounts ? { set: applicationGrant.accounts } : undefined,
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

      // create authorization request to track usage
      db.authorizationRequest.create({
        data: {
          data: authorizationRequestData as unknown as Prisma.JsonObject,
          type: 'FedCM',
          state: 'Authorized',
          clientId: client.id,
          userId: user.id,
        }
      })
    ]);

    const token = authorization.token;

    return NextResponse.json(
      { token },
      { headers: corsHeaders(request) }
    );
  } catch(error) {
    if(error instanceof OAuth2Error || error instanceof FedCMServerError) {
      console.log('[fed-cm/assert]', error.message);
      return NextResponse.json(
        { error: { code: error instanceof OAuth2Error ? error.code : 'invalid_request', error: error.message }},
        { status: error instanceof OAuth2Error ? error.httpStatus ?? 400 : 400, headers: corsHeaders(request) }
      );
    }

    console.error('[fed-cm/assert] error');
    console.error(error);

    return NextResponse.json(
      { error: { code: 'server_error', error: 'Unknown error' }},
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

export function GET(request: NextRequest): NextResponse<IdentityAssertionErrorResponse> {
  return NextResponse.json(
    { error: { code: 'invalid_request', error: 'Method not allowed' }},
    { status: 405, headers: corsHeaders(request) }
  );
}

interface Params {
  scope?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

function parseParams(params?: unknown): Params {
  if(!params || typeof params !== 'object') {
    return {};
  }

  return params;
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
