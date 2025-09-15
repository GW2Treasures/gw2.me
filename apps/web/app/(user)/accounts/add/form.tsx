import type { FC } from 'react';
import { Steps } from '@/components/Steps/Steps';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { addAccount } from './actions';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { Code } from '@/components/Layout/Code';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { getApiKeyVerificationName } from '@/lib/api-key-verification-name';

export interface AccountAddFormProps {
  returnTo?: string,
  requireVerification?: boolean,
}

export const AccountAddForm: FC<AccountAddFormProps> = async ({ returnTo, requireVerification = false }) => {
  const apiKeyName = await getApiKeyVerificationName();

  return (
    <Form action={addAccount.bind(null, returnTo, requireVerification)}>
      <Steps>
        <div>Visit the <ExternalLink href="https://account.arena.net/applications">Guild Wars 2 Account Page</ExternalLink></div>
        {!requireVerification ? (
          <div>
            Generate a new API key
            <div style={{ marginTop: 8 }}>
              It is recommended to grant all permissions, authorized applications will still only be able to access the data you allow them to.
            </div>
            <div style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
              <FlexRow wrap>Optional: Verify account ownership by using this API key name: <FlexRow><Code inline>{apiKeyName}</Code> <CopyButton copy={apiKeyName} iconOnly icon="copy"/></FlexRow></FlexRow>
            </div>
          </div>
        ) : (
          <div>
            <FlexRow wrap>Generate a new API key with this exact name: <FlexRow><Code inline>{apiKeyName}</Code> <CopyButton copy={apiKeyName} iconOnly icon="copy"/></FlexRow></FlexRow>
            <div style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
              Make sure to create a <b>new</b> API key, don&apos;t rename an existing one
            </div>
          </div>
        )}
        <div>
          Paste your key into this form
          <div style={{ display: 'flex', marginBlock: 8 }}>
            <TextInput placeholder="API key" name="api-key"/>
          </div>
          <FlexRow>
            {returnTo && (<LinkButton href={returnTo}>Cancel</LinkButton>)}
            <SubmitButton type="submit" icon="key-add">Add API key</SubmitButton>
          </FlexRow>
          <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, fontSize: 14, listStyle: 'none', padding: 0, marginTop: 16 }}>
            <li>gw2.me will only be able to read data of your account provided by the official API.</li>
            <li>gw2.me will NOT be able to write any data to your account.</li>
            <li>gw2.me will NOT share your API key with any 3rd party.</li>
            <li>You can remove access at any time by deleting the API key.</li>
          </ul>
        </div>
      </Steps>
    </Form>
  );
};
