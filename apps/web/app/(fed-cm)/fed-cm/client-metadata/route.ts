import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { db } from '@/lib/db';
import { IdentityAssertionErrorResponse, IdentityProviderClientMetadata } from '@fedcm/server';
import { assert } from '@/lib/oauth/assert';
import { getUrlFromRequest } from '@/lib/url';

export async function GET(request: NextRequest): Promise<NextResponse<IdentityProviderClientMetadata | IdentityAssertionErrorResponse>> {
  try {
    // get client_id query parameter
    const clientId = request.nextUrl.searchParams.get('client_id');

    // make sure client_id is set
    assert(clientId, OAuth2ErrorCode.invalid_request, { description: '`client_id` missing' });

    // get client from db
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: {
        application: { select: { privacyPolicyUrl: true, termsOfServiceUrl: true, imageId: true }}
      }
    });

    assert(client, OAuth2ErrorCode.invalid_client, { description: 'Invalid `client_id`', httpStatus: 404 });

    // return privacy policy and TOS urls
    return NextResponse.json({
      privacy_policy_url: client.application.privacyPolicyUrl || undefined,
      terms_of_service_url: client.application.termsOfServiceUrl || undefined,
      icons: client.application.imageId
        ? [{ url: new URL(`/api/file/${client.application.imageId}`, getUrlFromRequest(request)), size: 128 }]
        : undefined
    });
  } catch(error) {
    if(error instanceof OAuth2Error) {
      return NextResponse.json(
        { error: { code: error.code, error: error.description }},
        { status: error.httpStatus ?? 400 }
      );
    }

    console.error('[fed-cm/client-metadata] error');
    console.error(error);

    return NextResponse.json(
      { error: { code: 'server_error', error: 'Unknown error' }},
      { status: 500 }
    );
  }
}
