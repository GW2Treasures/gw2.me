import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  return NextResponse.json({
    url: request.url,
    next: request.nextUrl,
    headers: Object.fromEntries(request.headers.entries()),
  });
}
