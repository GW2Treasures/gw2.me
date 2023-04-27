import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // make sure example app exists
  const user = await db.user.upsert({
    where: { name: 'example' },
    create: { name: 'example' },
    update: {}
  });

  const application = await db.application.upsert({
    where: { id: '1e3d49dd-bbda-4780-a51a-e24db5d87826' },
    create: { id: '1e3d49dd-bbda-4780-a51a-e24db5d87826', clientId: 'example_client_id', clientSecret: 'example_client_secret', name: 'Example App', ownerId: user.id, description: 'This is the gw2.me example app', callbackUrls: ['http://localhost:4001/callback'] },
    update: { clientId: 'example_client_id', clientSecret: 'example_client_secret', name: 'Example App', ownerId: user.id, description: 'This is the gw2.me example app', callbackUrls: ['http://localhost:4001/callback'] }
  });

  redirect('http://localhost:4000/oauth2/authorize?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A4001%2Fcallback&client_id=example_client_id&scope=identify&state=example');
}
