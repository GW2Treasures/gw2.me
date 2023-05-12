import { NextResponse } from 'next/server';

export function GET(request: Request) {
  return NextResponse.json({
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  });
}
