import { NextRequest, NextResponse } from 'next/server';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  // get client_id query parameter
  const clientId = request.nextUrl.searchParams.get('client_id');

  // make sure client_id is set
  if(!clientId) {
    return NextResponse.json(
      { error: { code: OAuth2ErrorCode.invalid_request, details: 'client_id missing' }},
      { status: 400 }
    );
  }

  // get client from db
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: {
      application: { select: { privacyPolicyUrl: true, termsOfServiceUrl: true }}
    }
  });

  // make sure app exists
  if(!client) {
    return NextResponse.json(
      { error: { code: OAuth2ErrorCode.invalid_client, details: 'client_id not found' }},
      { status: 404 }
    );
  }

  // return privacy policy and TOS urls
  return NextResponse.json({
    'privacy_policy_url': client.application.privacyPolicyUrl || undefined,
    'terms_of_service_url': client.application.termsOfServiceUrl || undefined,
  });
}
