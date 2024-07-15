import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { getFormDataString } from '@/lib/form-data';
import { corsHeaders } from '@/lib/cors-header';
import { Authorization, AuthorizationType } from '@gw2me/database';
import { db } from '@/lib/db';
import { generateCode } from '@/lib/token';
import { expiresAt } from '@/lib/date';
import { Scope } from '@gw2me/client';

export async function POST(request: NextRequest) {
  // verify `Sec-Fetch-Dest: webidentity` header is set
  if(request.headers.get('Sec-Fetch-Dest') !== 'webidentity') {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'Missing `Sec-Fetch-Dest: webidentity` header' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // get user session
  const session = await getSession();

  if(!session) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.access_denied, details: 'no session' }},
      { status: 401, headers: corsHeaders(request) }
    );
  }

  // get data from request
  const formData = await request.formData();
  const clientId = getFormDataString(formData, 'client_id');
  const accountId = getFormDataString(formData, 'account_id');
  const disclosureTextShown = getFormDataString(formData, 'disclosure_text_shown') === 'true';
  const origin = request.headers.get('Origin');

  if(!clientId || !accountId || accountId !== session.userId || !origin) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'missing required fields' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // load application
  const application = await db.application.findUnique({
    where: { clientId },
    select: { id: true, callbackUrls: true }
  });

  // check that application exists
  if(!application) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_client, details: 'invalid client_id' }},
      { status: 404, headers: corsHeaders(request) }
    );
  }

  // verify origin matches a registered callback url
  const validOrigin = application.callbackUrls.some((url) => new URL(url).origin === origin);
  if(!validOrigin) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'wrong origin' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // load previous authorization to include scopes and
  const previousAuthorization = await db.authorization.findFirst({
    where: { applicationId: application.id, userId: session.userId, type: { not: AuthorizationType.Code }},
    select: { scope: true, accounts: { select: { id: true }}}
  });

  // always include previous scopes if available (as if `include_granted_scopes` is set during OAuth authorization)
  const scopes = new Set<Scope>(previousAuthorization?.scope as Scope[]);

  // if the disclose text was not shown don't add additional scopes
  if(!disclosureTextShown && (!scopes.has(Scope.Identify) || !scopes.has(Scope.Email))) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_scope, details: 'disclosure_text_shown = false and previous authorization does not include scopes "identify email"' }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // always include identify + email until FedCM gets a way to define scopes
  scopes.add(Scope.Identify);
  scopes.add(Scope.Email);

  // create code
  let authorization: Authorization;

  try {
    const identifier = {
      type: AuthorizationType.Code,
      applicationId: application.id,
      userId: session.userId
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
          accounts: previousAuthorization?.accounts ? { connect: previousAuthorization.accounts } : undefined,
        },
      }),
    ]);
  } catch(error) {
    console.log(error);

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
