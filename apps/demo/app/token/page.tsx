import { gw2me } from '@/lib/client';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { redirect } from 'next/navigation';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { PageProps } from '@/lib/next';

export const dynamic = 'force-dynamic';

async function refreshTokenAction(data: FormData) {
  'use server';

  const refresh_token = data.get('refresh_token')?.toString();

  if(!refresh_token) {
    throw new Error();
  }

  const token = await gw2me.refreshToken({ refresh_token });

  redirect(`/token?access_token=${token.access_token}&refresh_token=${token.refresh_token}`);
}

async function revokeAccessToken(data: FormData) {
  'use server';

  const access_token = data.get('access_token')?.toString();
  const refresh_token = data.get('refresh_token')?.toString();

  if(access_token) {
    await gw2me.revokeToken({ token: access_token });
  }

  redirect(`/token?refresh_token=${refresh_token}`);
}

async function revokeRefreshToken(data: FormData) {
  'use server';

  const access_token = data.get('access_token')?.toString();
  const refresh_token = data.get('refresh_token')?.toString();

  if(refresh_token) {
    await gw2me.revokeToken({ token: refresh_token });
  }

  redirect(`/token?access_token=${access_token}`);
}

async function getSubtoken(accountId: string, data: FormData) {
  'use server';

  const access_token = data.get('access_token')?.toString();

  if(!access_token) {
    throw new Error('Missing access_token');
  }

  const { subtoken } = await gw2me.api(access_token).subtoken(accountId);

  redirect(`https://api.guildwars2.com/v2/tokeninfo?access_token=${encodeURIComponent(subtoken)}`);
}

export default async function TokenPage({ searchParams: asyncSearchParams }: PageProps) {
  const searchParams = await asyncSearchParams;

  const access_token = Array.isArray(searchParams.access_token) ? searchParams.access_token[0] : searchParams.access_token;
  const refresh_token = Array.isArray(searchParams.refresh_token) ? searchParams.refresh_token[0] : searchParams.refresh_token;

  const api = access_token ? gw2me.api(access_token) : undefined;
  const user = await api?.user().catch((e) => String(e));
  const accounts = await api?.accounts().catch((e) => String(e));

  return (
    <form>
      <Label label="access_token">
        <TextInput value={access_token} readOnly name="access_token"/>
      </Label>
      <Label label="refresh_token">
        <TextInput value={refresh_token} readOnly name="refresh_token"/>
      </Label>

      <FlexRow>
        <Button icon="revision" type="submit" formAction={refreshTokenAction} disabled={!refresh_token}>Refresh Token</Button>
        <Button icon="delete" type="submit" formAction={revokeAccessToken} disabled={!access_token}>Revoke access_token</Button>
        <Button icon="delete" type="submit" formAction={revokeRefreshToken} disabled={!refresh_token}>Revoke refresh_token</Button>
      </FlexRow>
      <br/>

      <b>/api/user</b>
      <pre>{JSON.stringify(user, undefined, '  ')}</pre>
      <b>/api/accounts</b>
      <pre>{JSON.stringify(accounts, undefined, '  ')}</pre>

      <FlexRow>
        {typeof accounts === 'object' && accounts?.accounts?.map((account) => (
          <Button key={account.id} icon="key" type="submit" formAction={getSubtoken.bind(null, account.id)}>Get Subtoken ({account.name})</Button>
        ))}
      </FlexRow>
    </form>
  );
}

export const metadata = {
  title: 'Token'
};
