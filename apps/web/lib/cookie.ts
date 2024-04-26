import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { createSigner } from './jwt';

const baseDomain = process.env.BASE_DOMAIN;

export const SessionCookieName = 'gw2me-session';
export const UserCookieName = 'gw2me-user';

export function authCookie(sessionId: string, secure: boolean): ResponseCookie {
  return {
    name: SessionCookieName,
    value: sessionId,

    domain: baseDomain,
    sameSite: 'lax',
    httpOnly: true,
    priority: 'high',
    path: '/',
    secure,
  };
}

export function userCookie(userId: string): ResponseCookie {
  const signJwt = createSigner();
  const userJwt = signJwt({ sub: userId });

  return {
    name: UserCookieName,
    value: userJwt,

    domain: baseDomain,
    sameSite: 'lax',
    httpOnly: true,
    priority: 'medium',
    path: '/',
    secure: true,
    maxAge: 31536000
  };
}
