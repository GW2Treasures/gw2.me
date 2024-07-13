import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { getFormDataString } from '@/lib/form-data';
import { corsHeaders } from '@/lib/cors-header';

export async function POST(request: NextRequest) {
  const user = await getUser();

  if(!user) {
    return Response.json(
      { error: { code: OAuth2ErrorCode.access_denied }},
      { status: 401, headers: corsHeaders(request) }
    );
  }

  // get data from request
  const formData = await request.formData();
  const clientId = getFormDataString(formData, 'client_id');
  const accountId = getFormDataString(formData, 'account_id');

  if(!clientId || !accountId) {
    console.error(Object.fromEntries(formData.entries()));

    return Response.json(
      { error: { code: OAuth2ErrorCode.invalid_request }},
      { status: 400, headers: corsHeaders(request) }
    );
  }

  // create access token
  // TODO: impl
  const token = '$token$';

  return NextResponse.json(
    { token },
    { headers: corsHeaders(request) }
  );
}
