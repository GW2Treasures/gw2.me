import { db } from '@/lib/db';
import { Scope, UserResponse } from '@gw2me/client';
import { NextResponse } from 'next/server';
import { getApplicationGrantByAuthorization, withAuthorization } from '../auth';
import { Authorization } from '@gw2me/database';

export const GET = withAuthorization([Scope.Identify])(
  async (authorization: Authorization) => {
    const user = await db.user.findUnique({
      where: { id: authorization.userId },
      select: { id: true, name: true }
    });

    if(!user) {
      return NextResponse.json({ error: true }, { status: 404 });
    }

    // load email
    const email = authorization.scope.includes(Scope.Email)
      ? await getApplicationGrantByAuthorization(authorization).email({
        select: { email: true, verified: true }
      })
      : undefined;

    const response: UserResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: email?.email,
        emailVerified: email?.verified,
      }
    };

    return NextResponse.json(response);
  }
);
