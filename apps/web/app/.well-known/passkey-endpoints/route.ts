import { NextRequest, NextResponse } from 'next/server';
import { getUrlFromRequest } from '@/lib/url';

export function GET(request: NextRequest) {
  const providerPage = new URL('/providers', getUrlFromRequest(request));

  return NextResponse.json({
    enroll: providerPage,
    manage: providerPage
  });
}
