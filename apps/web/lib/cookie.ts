import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const baseDomain = process.env.BASE_DOMAIN;

export const SessionCookieName = 'gw2me-session';

export function authCookie(value: string, secure: boolean): ResponseCookie {
  return {
    name: SessionCookieName,
    value,

    domain: baseDomain,
    sameSite: 'lax',
    httpOnly: true,
    priority: 'high',
    path: '/',
    secure,
  };
}
