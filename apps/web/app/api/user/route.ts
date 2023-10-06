import { db } from '@/lib/db';
import { Scope, UserResponse } from '@gw2me/client';
import { NextResponse } from 'next/server';
import { withAuthorization } from '../auth';
import { Authorization } from '@gw2me/database';

export const GET = withAuthorization([Scope.Identify])(
  async (authorization: Authorization) => {
    const user = await db.user.findUnique({
      where: { id: authorization.userId },
      select: { id: true, name: true, email: authorization.scope.includes(Scope.Email) }
    });

    if(!user) {
      return NextResponse.json({ error: true }, { status: 404 });
    }

    const response: UserResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email ?? undefined
      }
    };

    return NextResponse.json(response);
  }
);
