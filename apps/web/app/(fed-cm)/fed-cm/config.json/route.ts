import { getUrlFromRequest } from '@/lib/url';
import type { IdentityProviderAPIConfig } from '@fedcm/server';
import { NextRequest, NextResponse } from 'next/server';
import icon40 from './fed-cm-40.png';

export function GET(request: NextRequest) {
  const baseUrl = getUrlFromRequest(request);

  return NextResponse.json<IdentityProviderAPIConfig>({
    accounts_endpoint: new URL('/fed-cm/accounts', baseUrl),
    client_metadata_endpoint: new URL('/fed-cm/client-metadata', baseUrl),
    id_assertion_endpoint: new URL('/fed-cm/assert', baseUrl),
    login_url: new URL('/fed-cm/login', baseUrl),
    branding: {
      name: 'gw2.me',
      background_color: '#b7000d',
      color: '#ffffff',
      icons: [{ url: new URL(icon40.src, baseUrl).toString(), size: 40 }]
    }
  });
}
