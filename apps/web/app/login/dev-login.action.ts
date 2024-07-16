'use server';

import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { authCookie, loginErrorCookie, userCookie } from '@/lib/cookie';
import { cookies } from 'next/headers';
import { LoginError } from './form';

export async function devLogin(name: string) {
  if(process.env.NODE_ENV === 'production') {
    notFound();
  }

  if(!name) {
    cookies().set(loginErrorCookie(LoginError.Unknown));
    redirect('/login');
  }

  const { id: userId } = await db.user.upsert({
    where: { name },
    create: { name },
    update: {}
  });

  const session = await db.userSession.create({
    data: { info: 'Dev Login', userId },
    select: { id: true }
  });

  cookies().set(authCookie(session.id));
  cookies().set(userCookie(userId));
}
