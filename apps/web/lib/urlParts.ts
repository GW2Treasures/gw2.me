import { NextRequest } from 'next/server';

export interface UrlParts {
  domain: string;
  protocol: 'http:' | 'https:';
  port: string;
  path: `/${string}`;
}

export function getUrlPartsFromRequest(request: NextRequest): UrlParts {
  const domain = request.headers.get('Host')?.split(':')[0];
  const protocolRaw = request.headers.get('X-Forwarded-Proto')?.concat(':') ?? request.nextUrl.protocol;
  const port = request.headers.get('X-Forwarded-Port')?.split(',')[0] ?? request.nextUrl.port;
  const path = request.nextUrl.pathname as UrlParts['path'];

  if(!domain) {
    throw new Error('Could not parse Host header');
  }

  const protocol = protocolRaw.startsWith('https') ? 'https:' : 'http:';

  return { domain, protocol, port, path };
}

export function getUrlFromParts(parts: UrlParts): string {
  const { domain, protocol, path } = parts;

  return `${protocol}//${domain}${getPortSuffix(parts)}${path}`;
}

function getPortSuffix({ protocol, port }: UrlParts) {
  if((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
    return '';
  }

  return `:${port}`;
}

function isSupportedProtocol(protocol: string): protocol is UrlParts['protocol'] {
  return protocol === 'http:' || protocol === 'https:';
}
