import { db } from '@/lib/db';
import { Scope, UserResponse } from '@gw2me/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');

  if(!auth) {
    return NextResponse.json({ error: true }, { status: 401 });
  }

  const [tokenType, token] = auth.split(' ');

  if(tokenType !== 'Bearer' || !token) {
    return NextResponse.json({ error: true }, { status: 400 });
  }

  const authorization = await db.authorization.findUnique({ where: { type_token: { token, type: 'AccessToken' }}, include: { user: true }});

  if(!authorization || !authorization.scope.includes(Scope.Identify)) {
    return NextResponse.json({ error: true }, { status: 401 });
  }

  const response: UserResponse = {
    user: {
      id: authorization.userId,
      name: authorization.user.name,
      email: authorization.scope.includes(Scope.Email) ? authorization.user.email ?? undefined : undefined
    }
  };

  return NextResponse.json(response);
}
