import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { createJwt } from './jwt';
import { LoginError } from 'app/login/form';

const baseDomain = process.env.BASE_DOMAIN;

export const SessionCookieName = 'gw2me-session';
export const UserCookieName = 'gw2me-user';
export const LoginErrorCookieName = 'gw2me-login-error';

export function authCookie(sessionId: string): ResponseCookie {
  return {
    name: SessionCookieName,
    value: sessionId,

    domain: baseDomain,
    // SameSite=none is required for FedCM (see https://github.com/fedidcg/FedCM/issues/587)
    sameSite: 'none',
    httpOnly: true,
    priority: 'high',
    path: '/',
    secure: true,
  };
}

export async function userCookie(userId: string): Promise<ResponseCookie> {
  const userJwt = await createJwt({ sub: userId });

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

export async function loginErrorCookie(err: LoginError): Promise<ResponseCookie> {
  const errorJwt = await createJwt({ err });

  return {
    name: LoginErrorCookieName,
    value: errorJwt,

    domain: baseDomain,
    sameSite: 'lax',
    httpOnly: true,
    priority: 'high',
    path: '/',
    secure: true,
    maxAge: 60
  };
}
