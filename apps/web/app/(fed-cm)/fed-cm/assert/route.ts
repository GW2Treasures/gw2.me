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
  const session = await getSession();

  if(!session) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.access_denied }},
      { status: 401, headers: corsHeaders(request) }
    );
  }

  // get data from request
  const formData = await request.formData();
  const clientId = getFormDataString(formData, 'client_id');
  const accountId = getFormDataString(formData, 'account_id');

  if(!clientId || !accountId || accountId !== session.userId) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // load application
  const application = await db.application.findUnique({
    where: { clientId },
    select: { id: true }
  });

  // check that application exists
  if(!application) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_client }},
      { status: 404, headers: corsHeaders(request) }
    );
  }

  // load previous authorization to include scopes and
  const previousAuthorization = await db.authorization.findFirst({
    where: { applicationId: application.id, userId: session.userId, type: { not: AuthorizationType.Code }},
    select: { scope: true, accounts: { select: { id: true }}}
  });

  // include previous scopes and identify + email
  const scopes = new Set<Scope>(previousAuthorization?.scope as Scope[]);
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
