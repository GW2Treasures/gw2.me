import { getUrlFromRequest } from '@/lib/url';
import type { IdentityProviderWellKnown } from '@fedcm/server';
import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const baseUrl = getUrlFromRequest(request);

  return NextResponse.json<IdentityProviderWellKnown>({
    provider_urls: [new URL('/fed-cm/config.json', baseUrl)],
    accounts_endpoint: new URL('/fed-cm/accounts', baseUrl),
    login_url: new URL('/fed-cm/login', baseUrl),
  });
}
