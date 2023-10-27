'use server';

import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { authCookie } from '@/lib/cookie';
import { cookies } from 'next/headers';

export async function devLogin(name: string) {
  if(process.env.NODE_ENV === 'production') {
    notFound();
  }

  if(!name) {
    redirect('/login?error');
  }

  const { id } = await db.user.upsert({
    where: { name },
    create: { name },
    update: {}
  });

  const session = await db.userSession.create({ data: { info: 'Dev Login', userId: id }});

  cookies().set(authCookie(session.id, false));
}
