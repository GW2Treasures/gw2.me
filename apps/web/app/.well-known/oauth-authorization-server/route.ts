import { AuthenticationMethod } from "@/lib/oauth/types";
import { getUrlFromRequest } from "@/lib/url";
import { Scope } from "@gw2me/client";
import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const currentUrl = getUrlFromRequest(request);

  const metadata = {
    issuer: currentUrl.origin,
    authorization_endpoint: new URL('/oauth2/authorize', currentUrl),
    token_endpoint: new URL('/api/token', currentUrl),
    scopes_supported: Object.values(Scope),
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: Object.values(AuthenticationMethod),
    service_documentation: new URL('/dev/docs', currentUrl),
    code_challenge_methods_supported: ['S256'],
    authorization_response_iss_parameter_supported: true,
  };

  return NextResponse.json(metadata);
}
