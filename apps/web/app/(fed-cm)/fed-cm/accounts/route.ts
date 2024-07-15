import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import accountIcon from './fed-cm-account.png';
import { getUrlFromRequest } from '@/lib/url';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getUser();

  if(!user) {
    return new Response(null, { status: 401 });
  }

  const notExpired = {
    OR: [
      { expiresAt: { gte: new Date() }},
      { expiresAt: null }
    ]
  };
  const approvedApplications = await db.application.findMany({
    where: { authorizations: { some: { type: 'AccessToken', userId: user.id, ...notExpired }}},
    select: { clientId: true }
  });

  const baseUrl = getUrlFromRequest(request);

  return NextResponse.json({
    accounts: [{
      id: user.id,
      name: user.name,
      email: user.email ?? user.name,
      picture: new URL(accountIcon.src, baseUrl),
      approved_clients: approvedApplications.map(({ clientId }) => clientId),
    }]
  });
}
