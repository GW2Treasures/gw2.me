import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { getFormDataString } from '@/lib/form-data';
import { corsHeaders } from '@/lib/cors-header';
import { Authorization, AuthorizationType } from '@gw2me/database';
import { db } from '@/lib/db';
import { generateCode } from '@/lib/token';
import { expiresAt } from '@/lib/date';
import { Scope } from '@gw2me/client';
import { normalizeScopes } from 'app/(authorize)/oauth2/authorize/validate';

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

  // load application
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, callbackUrls: true }
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

  // load previous authorization to include scopes and
  const previousAuthorization = await db.authorization.findFirst({
    where: { clientId, userId: user.id, type: { not: AuthorizationType.Code }},
    select: { scope: true, accounts: { select: { id: true }}}
  });

  // get previously authorized scopes
  const previousScopes = new Set(previousAuthorization?.scope as Scope[]);

  // get requested scopes if params.scopes is set, otherwise default to Identify+Email
  const requestedScopes = new Set(params.scope?.split(' ') as Scope[] ?? [Scope.Identify, Scope.Email]);
  normalizeScopes(requestedScopes);

  // always include previous scopes if available (as if `include_granted_scopes` is set during OAuth authorization)
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
    // TODO: use continue_on to display auth screen
    console.error('[fed-cm/assert] undisclosed scopes', undisclosedNewScopes);
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_scope, details: 'undisclosed new scopes' }},
      { status: 400, headers: corsHeaders(request) }
    );
    // const authorizationRequest = await createAuthorizationRequest(AuthorizationRequestType.FedCM, {
    //   client_id: clientId,
    //   response_type: 'code',
    //   scope: Array.from(scopes).join(' '),
    //   include_granted_scopes: 'true',
    // });

    // const continue_on = new URL(`/authorize/${authorizationRequest.id}`, getUrlFromRequest(request)).toString();

    // return NextResponse.json(
    //   { continue_on },
    //   { headers: corsHeaders(request) }
    // );
  }

  // create code
  let authorization: Authorization;

  try {
    const identifier = {
      type: AuthorizationType.Code,
      clientId,
      userId: user.id
    };

    [, authorization] = await db.$transaction([
      // delete old pending authorization codes for this app
      db.authorization.deleteMany({ where: identifier }),

      // create code authorization in db
      db.authorization.create({
        data: {
          ...identifier,
          scope: Array.from(scopes),
          token: generateCode(),
          expiresAt: expiresAt(60),
          emailId: user.defaultEmail?.id,
          accounts: previousAuthorization?.accounts ? { connect: previousAuthorization.accounts } : undefined,
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

function parseParams(params?: string): { scope?: string } {
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
