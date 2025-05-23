import { createDPoPJwt, getGw2MeUrl, gw2me } from '@/lib/client';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { redirect } from 'next/navigation';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { PageProps } from '@/lib/next';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { Client } from './client';
import { Icon } from '@gw2treasures/ui';

export const dynamic = 'force-dynamic';

async function refreshTokenAction(data: FormData) {
  'use server';

  const refresh_token = data.get('refresh_token')?.toString();

  if(!refresh_token) {
    throw new Error();
  }

  const token = await gw2me.refreshToken({ refresh_token });

  redirect(`/token?access_token=${token.access_token}&refresh_token=${token.refresh_token}&token_type=${token.token_type}`);
}

async function refreshTokenActionDPoP(data: FormData) {
  'use server';

  const refresh_token = data.get('refresh_token')?.toString();

  if(!refresh_token) {
    throw new Error();
  }

  const token = await gw2me.refreshToken({ refresh_token, dpop: createDPoPJwt });

  redirect(`/token?access_token=${token.access_token}&refresh_token=${token.refresh_token}&token_type=${token.token_type}`);
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
  const token_type = data.get('token_type') === 'DPoP' ? 'DPoP' : 'Bearer';

  if(refresh_token) {
    await gw2me.revokeToken({ token: refresh_token });
  }

  redirect(`/token?access_token=${access_token}&token_type=${token_type}`);
}

async function getSubtoken(accountId: string, data: FormData) {
  'use server';

  const access_token = data.get('access_token')?.toString();
  const token_type = data.get('token_type') === 'DPoP' ? 'DPoP' : 'Bearer';

  if(!access_token) {
    throw new Error('Missing access_token');
  }

  // get requested permissions
  const requestedPermissions = data.getAll('permission').filter((permission) => typeof permission === 'string');

  const api = gw2me.api(access_token, { dpop: token_type === 'DPoP' ? createDPoPJwt : undefined });
  const { subtoken } = await api.subtoken(accountId, { permissions: requestedPermissions });

  redirect(`https://api.guildwars2.com/v2/tokeninfo?v=latest&access_token=${encodeURIComponent(subtoken)}`);
}

export default async function TokenPage({ searchParams: asyncSearchParams }: PageProps) {
  const searchParams = await asyncSearchParams;

  const access_token = Array.isArray(searchParams.access_token) ? searchParams.access_token[0] : searchParams.access_token;
  const refresh_token = Array.isArray(searchParams.refresh_token) ? searchParams.refresh_token[0] : searchParams.refresh_token;
  const token_type = searchParams.token_type === 'DPoP' ? 'DPoP' : 'Bearer';

  const api = access_token
    ? gw2me.api(access_token, { dpop: token_type === 'DPoP' ? createDPoPJwt : undefined })
    : undefined;

  const [user, accounts, introspectAccessToken, introspectRefreshToken] = await Promise.all([
    api?.user().catch((e) => String(e)),
    api?.accounts().catch((e) => String(e)),
    gw2me.introspectToken({ token: access_token! }).catch((e) => String(e)),
    gw2me.introspectToken({ token: refresh_token! }).catch((e) => String(e)),
  ]);

  return (
    <>
      <Client clientId={process.env.DEMO_CLIENT_ID!} gw2meUrl={getGw2MeUrl()} accessToken={access_token}/>

      <form>
        <input type="hidden" name="token_type" value={token_type}/>
        <Label label="access_token">
          <TextInput value={access_token} readOnly name="access_token"/>
        </Label>
        <Label label="refresh_token">
          <TextInput value={refresh_token} readOnly name="refresh_token"/>
        </Label>

        <FlexRow>
          <Button icon="revision" type="submit" formAction={refreshTokenAction} disabled={!refresh_token}>Refresh Token</Button>
          <Button icon="revision" type="submit" formAction={refreshTokenActionDPoP} disabled={!refresh_token}>Refresh Token (with DPoP)</Button>
          <Button icon="delete" type="submit" formAction={revokeAccessToken} disabled={!access_token}>Revoke access_token</Button>
          <Button icon="delete" type="submit" formAction={revokeRefreshToken} disabled={!refresh_token}>Revoke refresh_token</Button>
        </FlexRow>
        <br/>

        <b>/api/user</b>
        <pre>{JSON.stringify(user, undefined, '  ')}</pre>
        <b>/api/accounts</b>
        <pre>{JSON.stringify(accounts, undefined, '  ')}</pre>
        <b>/api/token/introspect</b> (access_token)
        <pre>{JSON.stringify(introspectAccessToken, undefined, '  ')}</pre>
        <b>/api/token/introspect</b> (refresh_token)
        <pre>{JSON.stringify(introspectRefreshToken, undefined, '  ')}</pre>
      </form>

      {typeof accounts === 'object' && typeof introspectAccessToken === 'object' && introspectAccessToken.active && accounts?.accounts?.map((account) => (
        <form key={account.id} action={getSubtoken.bind(null, account.id)} style={{ marginBottom: 16 }}>
          <input type="hidden" name="access_token" value={access_token}/>
          <input type="hidden" name="token_type" value={token_type}/>
          <FlexRow>
            <b>{account.displayName ? `${account.displayName} (${account.name})` : account.name}</b>
            {account.verified && <Icon icon="verified"/>}
            {account.shared && <Icon icon="share"/>}
          </FlexRow>
          <FlexRow>
            {introspectAccessToken.scope.split(' ').filter((scope) => scope.startsWith('gw2:')).map((scope) => scope.substring(4)).map((permission) => (
              <Checkbox key={permission} defaultChecked name="permission" formValue={permission}>{permission}</Checkbox>
            ))}
          </FlexRow>
          <FlexRow>
            <SubmitButton icon="key">Get Subtoken</SubmitButton>
          </FlexRow>
        </form>
      ))}
    </>
  );
}

export const metadata = {
  title: 'Token'
};
