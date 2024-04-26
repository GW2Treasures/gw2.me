import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';

export async function GET() {
  const user = await getUser();

  if(!user) {
    return new Response(null, { status: 401 });
  }

  return NextResponse.json({
    accounts: [{
      id: user.id,
      name: user.name,
      email: user.email ?? user.name,
      approved_clients: [],
    }]
  });
}
