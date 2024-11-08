import { headers } from 'next/headers';

export function getUrlFromRequest(request: Request) {
  const url = new URL(request.url);
  url.host = request.headers.get('Host')?.split(':')[0] ?? url.host;
  url.port = request.headers.get('X-Forwarded-Port')?.split(',')[0] ?? url.port;
  url.protocol = request.headers.get('X-Forwarded-Proto')?.split(',')[0].concat(':') ?? url.protocol;

  return url;
}

export async function getBaseUrlFromHeaders() {
  const url = new URL('http://x/');

  const headerStore = await headers();

  url.host = headerStore.get('X-Forwarded-Host') ?? headerStore.get('Host') ?? url.host;
  url.protocol = headerStore.get('X-Forwarded-Proto')?.split(',')[0].concat(':') ?? url.protocol;

  return url;
}
