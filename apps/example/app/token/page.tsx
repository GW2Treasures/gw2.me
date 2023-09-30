import { client_id, client_secret } from '@/lib/client';
import { refreshToken, rest } from '@gw2me/api';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { redirect } from 'next/navigation';
import { Button } from '@gw2treasures/ui/components/Form/Button';

export const dynamic = 'force-dynamic';

async function refreshTokenAction(data: FormData) {
  'use server';

  const refresh_token = data.get('refresh_token')?.toString();

  if(!refresh_token) {
    throw new Error();
  }

  const token = await refreshToken({ refresh_token, client_id, client_secret });

  redirect(`/token?access_token=${token.access_token}&refresh_token=${token.refresh_token}`);
};

export default async function TokenPage({ searchParams }: { searchParams: { access_token: string; refresh_token: string; }}) {
  const access_token = searchParams.access_token;

  const user = await rest.user({ access_token });
  const accounts = await rest.accounts({ access_token });

  return (
    <form action={refreshTokenAction}>
      <Label label="access_token">
        <TextInput value={searchParams.access_token} readOnly name="access_token"/>
      </Label>
      <Label label="refresh_token">
        <TextInput value={searchParams.refresh_token} readOnly name="refresh_token"/>
      </Label>

      <Button type="submit">Refresh Token</Button>

      <pre>{JSON.stringify(user, undefined, '  ')}</pre>
      <pre>{JSON.stringify(accounts, undefined, '  ')}</pre>
    </form>
  );
}
