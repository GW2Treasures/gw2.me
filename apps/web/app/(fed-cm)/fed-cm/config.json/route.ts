import { NextRequest, NextResponse } from 'next/server';
import icon from '../../../icon.svg';
import { getUrlFromRequest } from '@/lib/url';

export function GET(request: NextRequest) {
  const baseUrl = getUrlFromRequest(request);

  return NextResponse.json({
    accounts_endpoint: '/fed-cm/accounts',
    client_metadata_endpoint: '/fed-cm/client-metadata',
    id_assertion_endpoint: '/fed-cm/assert',
    login_url: '/fed-cm/login',
    branding: {
      background_color: '#b7000d',
      color: '#ffffff',
      icons: [{ url: new URL(icon.src, baseUrl) }]
    }
  });
}
