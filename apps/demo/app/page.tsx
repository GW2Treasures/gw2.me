import { createDPoPJwt, getCallback, getDPoPPair, getPKCEPair, gw2me } from '@/lib/client';
import { AuthorizationUrlParams, Scope } from '@gw2me/client';
import { jwkThumbprint } from '@gw2me/client/dpop';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { Select } from '@gw2treasures/ui/components/Form/Select';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export default function HomePage() {
  return (
    <form action={login}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <Label label="Scopes">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {Object.values(Scope).map((scope) => (
              <Checkbox key={scope} name="scopes" formValue={scope} defaultChecked={[Scope.Identify, Scope.Email, Scope.GW2_Account].includes(scope)}>{scope}</Checkbox>
            ))}
          </div>
        </Label>

        <Label label="Prompt">
          <Select name="prompt" options={[{ value: '', label: 'Default' }, { value: 'none', label: 'Prompt: None' }, { value: 'consent', label: 'Prompt: Consent' }]}/>
        </Label>
        <Label label="Options">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Checkbox name="include_granted_scopes" formValue="true">include_granted_scopes</Checkbox>
            <Checkbox name="verified_accounts_only" formValue="true">verified_accounts_only</Checkbox>
            <Checkbox name="par" formValue="true">Use Pushed Authorization Requests (PAR)</Checkbox>
            <Checkbox name="dpop" formValue="true" defaultChecked>Use Demonstrating Proof of Possession (DPoP)</Checkbox>
          </div>
        </Label>
      </div>

      <SubmitButton icon="gw2me" iconColor="var(--color-brand)">Login with gw2.me</SubmitButton>
    </form>
  );
}

export const metadata: Metadata = {
  title: 'gw2.me Demo'
};

async function login(formData: FormData) {
  'use server';

  const scopes = formData.getAll('scopes') as Scope[];
  const prompt = (formData.get('prompt') || undefined) as 'consent' | 'none' | undefined;
  const include_granted_scopes = formData.get('include_granted_scopes') === 'true';
  const verified_accounts_only = formData.get('verified_accounts_only') === 'true';
  const par = formData.get('par') === 'true';
  const dpop = formData.get('dpop') === 'true';

  const { challenge } = await getPKCEPair();
  const dpopKeys = await getDPoPPair();

  const requestParams: AuthorizationUrlParams = {
    redirect_uri: getCallback(dpop),
    scopes,
    state: 'example',
    ...challenge,
    dpop_jkt: dpop ? await jwkThumbprint(dpopKeys.publicKey) : undefined,
    prompt,
    include_granted_scopes,
    verified_accounts_only,
  };

  if(par) {
    const pushed = await gw2me.pushAuthorizationRequest({ ...requestParams, dpop: dpop ? createDPoPJwt : undefined });
    const authUrl = gw2me.getAuthorizationUrl(pushed);
    redirect(authUrl);
  } else {
    const authUrl = gw2me.getAuthorizationUrl(requestParams);
    redirect(authUrl);
  }
}
