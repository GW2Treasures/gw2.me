import { client_id, client_secret } from '@/lib/client';
import { action } from '@/lib/action';
import { refreshToken, rest } from '@gw2me/api';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const refreshTokenAction = action(async (data) => {
  'use server';

  const refresh_token = data.get('refresh_token')?.toString();

  if(!refresh_token) {
    throw new Error();
  }

  const token = await refreshToken({ refresh_token, client_id, client_secret });

  redirect(`/token?access_token=${token.access_token}&refresh_token=${token.refresh_token}`);
});

export default async function TokenPage({ searchParams }: { searchParams: { access_token: string; refresh_token: string; }}) {
  const user = await rest.user({ access_token: searchParams.access_token });

  return (
    <form method="POST" action="">
      <Label label="access_token">
        <TextInput value={searchParams.access_token} readOnly name="access_token"/>
      </Label>
      <Label label="refresh_token">
        <TextInput value={searchParams.refresh_token} readOnly name="refresh_token"/>
      </Label>

      <pre>{JSON.stringify(user, undefined, '  ')}</pre>

      <button type="submit" name="$$id" value={refreshTokenAction.$$id}>Refresh Token</button>
    </form>
  );
}
