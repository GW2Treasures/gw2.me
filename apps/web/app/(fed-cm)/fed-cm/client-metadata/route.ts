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

  // get application from db
  const app = await db.application.findUnique({
    where: { clientId },
    select: { privacyPolicyUrl: true, termsOfServiceUrl: true }
  });

  // make sure app exists
  if(!app) {
    return NextResponse.json(
      { error: { code: OAuth2ErrorCode.invalid_client, details: 'client_id not found' }},
      { status: 404 }
    );
  }

  // return privacy policy and TOS urls
  return NextResponse.json({
    'privacy_policy_url': app.privacyPolicyUrl || undefined,
    'terms_of_service_url': app.termsOfServiceUrl || undefined,
  });
}
