import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { Scope, getAuthorizationUrl } from '@gw2me/api';
import { randomBytes, scryptSync } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // make sure example app exists
  const user = await db.user.upsert({
    where: { name: 'example' },
    create: { name: 'example' },
    update: {}
  });

  const clientSecret = generateClientSecret();

  const application = await db.application.upsert({
    where: { id: '1e3d49dd-bbda-4780-a51a-e24db5d87826' },
    create: { id: '1e3d49dd-bbda-4780-a51a-e24db5d87826', clientId: 'example_client_id', clientSecret, name: 'Example App', ownerId: user.id, description: 'This is the gw2.me example app', callbackUrls: ['http://localhost:4001/callback'] },
    update: { clientId: 'example_client_id', clientSecret, name: 'Example App', ownerId: user.id, description: 'This is the gw2.me example app', callbackUrls: ['http://localhost:4001/callback'] }
  });

  const authUrl = getAuthorizationUrl({
    client_id: 'example_client_id',
    redirect_uri: 'http://localhost:4001/callback',
    scopes: [Scope.Identify],
    state: 'example',
  });

  redirect(authUrl);
}

function generateClientSecret() {
  const secret = Buffer.from('example_client_secret', 'utf-8');
  const salt = randomBytes(16);
  const hash = scryptSync(secret, salt, 16);
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
}
