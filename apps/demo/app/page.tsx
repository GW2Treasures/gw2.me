import { Button } from '@gw2treasures/ui/components/Form/Button';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { Select } from '@gw2treasures/ui/components/Form/Select';
import { redirect } from 'next/navigation';
import { Scope } from '@gw2me/client';
import { getCallback, getPKCEPair, gw2me } from '@/lib/client';
import { Label } from '@gw2treasures/ui/components/Form/Label';

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
          </div>
        </Label>
      </div>

      <div style={{ '--icon-color': 'var(--color-brand)' }}>
        <Button type="submit" icon="gw2me">Login with gw2.me</Button>
      </div>

    </form>
  );
}

export const metadata = {
  title: 'gw2.me Demo'
};

// eslint-disable-next-line require-await
async function login(formData: FormData) {
  'use server';

  const scopes = formData.getAll('scopes') as Scope[];
  const prompt = (formData.get('prompt') || undefined) as 'consent' | 'none' | undefined;
  const include_granted_scopes = formData.get('include_granted_scopes') === 'true';
  const verified_accounts_only = formData.get('verified_accounts_only') === 'true';

  const { challenge } = await getPKCEPair();

  const authUrl = gw2me.getAuthorizationUrl({
    redirect_uri: getCallback(),
    scopes,
    state: 'example',
    ...challenge,
    prompt,
    include_granted_scopes,
    verified_accounts_only,
  });

  redirect(authUrl);
}
