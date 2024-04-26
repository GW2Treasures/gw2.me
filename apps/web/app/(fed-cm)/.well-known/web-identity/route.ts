import { NextRequest, NextResponse } from 'next/server';
import { getUrlFromRequest } from '@/lib/url';

export function GET(request: NextRequest) {
  const configUrl = new URL('/fed-cm/config.json', getUrlFromRequest(request));

  return NextResponse.json({
    provider_urls: [configUrl]
  });
}
