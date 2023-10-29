'use client';

import { FC } from 'react';
import { Steps } from '@/components/Steps/Steps';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { addAccount } from './actions';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Form } from '@/components/Form/Form';

export interface AccountAddFormProps {
  returnTo?: string;
}

export const AccountAddForm: FC<AccountAddFormProps> = ({ returnTo }) => {
  return (
    <div>
      <Headline id="create">Add API Key</Headline>
      <Form action={addAccount.bind(null, returnTo)}>
        <Steps>
          <div>Visit the <ExternalLink href="https://account.arena.net/applications">Guild Wars 2 Account Page</ExternalLink></div>
          <div>Generate a new API key</div>
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
    </div>
  );
};
