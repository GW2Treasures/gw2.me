import { Button } from '@gw2treasures/ui/components/Form/Button';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Scope, getAuthorizationUrl } from '@gw2me/api';
import { randomBytes, scryptSync } from 'crypto';
import { client_id } from '@/lib/client';

export default function HomePage() {
  return (
    <form action={login}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Object.values(Scope).map((scope) => (
          <Checkbox key={scope} name="scopes" formValue={scope} defaultChecked={[Scope.Identify, Scope.Email, Scope.GW2_Account].includes(scope)}>{scope}</Checkbox>
        ))}
      </div>

      <Button type="submit" icon="gw2me">Login with gw2.me</Button>
    </form>
  );
}

export const metadata = {
  title: 'gw2.me Example'
};

async function login(formData: FormData) {
  'use server';

  const scopes = formData.getAll('scopes') as Scope[];

  // make sure example app exists
  const user = await db.user.upsert({
    where: { name: 'example' },
    create: { name: 'example' },
    update: {}
  });

  const clientSecret = generateClientSecret();

  await db.application.upsert({
    where: { id: '1e3d49dd-bbda-4780-a51a-e24db5d87826' },
    create: { id: '1e3d49dd-bbda-4780-a51a-e24db5d87826', clientId: client_id, clientSecret, name: 'Example App', ownerId: user.id, description: 'This is the gw2.me example app', callbackUrls: ['http://localhost:4001/callback'] },
    update: { clientId: client_id, clientSecret, name: 'Example App', ownerId: user.id, description: 'This is the gw2.me example app', callbackUrls: ['http://localhost:4001/callback'] }
  });

  const authUrl = getAuthorizationUrl({
    client_id,
    redirect_uri: 'http://localhost:4001/callback',
    scopes,
    state: 'example',
  });

  redirect(authUrl);
}

function generateClientSecret() {
  const secret = Buffer.from('example_client_secret', 'utf-8');
  const salt = randomBytes(16);
  const hash = scryptSync(secret, salt, 32);
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
}
