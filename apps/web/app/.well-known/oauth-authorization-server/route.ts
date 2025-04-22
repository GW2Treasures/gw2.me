import { supportedDPoPAlgorithms } from '@/lib/oauth/dpop';
import { AuthenticationMethod } from '@/lib/oauth/types';
import { getUrlFromRequest } from '@/lib/url';
import { Scope } from '@gw2me/client';
import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const currentUrl = getUrlFromRequest(request);

  const metadata = {
    issuer: currentUrl.origin,
    service_documentation: new URL('/dev/docs', currentUrl),

    authorization_endpoint: new URL('/oauth2/authorize', currentUrl),
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    scopes_supported: Object.values(Scope),
    code_challenge_methods_supported: ['S256'],
    authorization_response_iss_parameter_supported: true,
    dpop_signing_alg_values_supported: supportedDPoPAlgorithms,

    pushed_authorization_request_endpoint: new URL('/oauth2/par', currentUrl),
    require_pushed_authorization_requests: false,

    token_endpoint: new URL('/api/token', currentUrl),
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: Object.values(AuthenticationMethod),

    revocation_endpoint: new URL('/api/token/revoke', currentUrl),
    revocation_endpoint_auth_methods_supported: Object.values(AuthenticationMethod),

    introspection_endpoint: new URL('/api/token/introspect', currentUrl),
    introspection_endpoint_auth_methods_supported: Object.values(AuthenticationMethod),
  };

  return NextResponse.json(metadata);
}
