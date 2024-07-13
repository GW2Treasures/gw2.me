import { NextRequest, NextResponse } from 'next/server';
import { getUrlFromRequest } from '@/lib/url';

export function GET(request: NextRequest) {
  const privacyPolicyUrl = new URL('/privacy', getUrlFromRequest(request));

  return NextResponse.json({
    'privacy_policy_url': privacyPolicyUrl,
  });
}
