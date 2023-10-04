'use client';

import { FC } from 'react';
import { experimental_useFormState as useFormState } from 'react-dom';
import { Steps } from '@/components/Steps/Steps';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { addAccount } from './actions';

export interface AccountAddFormProps {
  // TODO: add props
}

export const AccountAddForm: FC<AccountAddFormProps> = ({ }) => {
  const [state, action] = useFormState(addAccount, {});

  return (
    <div>
      <Headline id="create">Add Account</Headline>
      {state.message && (
        <div style={{ padding: 16, background: '#b7000d', color: '#fff', marginBottom: 16, borderRadius: 2 }}>
          {state.message}
        </div>
      )}
      <Steps>
        <div>Visit the <a href="https://account.arena.net/applications">Guild Wars 2 Account Page</a></div>
        <div>Generate a new API key</div>
        <form action={action}>
          Paste your key into this form
          <div style={{ display: 'flex', marginBlock: 8 }}>
            <TextInput placeholder="API key" name="api-key"/>
          </div>
          <Button type="submit">Submit</Button>
          <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, fontSize: 14, listStyle: 'none', padding: 0 }}>
            <li>gw2.me will only be able to read data of your account provided by the official API.</li>
            <li>gw2.me will NOT be able to write any data to your account.</li>
            <li>gw2.me will NOT share your API key with any 3rd party.</li>
            <li>You can remove access at any time by deleting the API key.</li>
          </ul>
        </form>
      </Steps>
    </div>
  );
};
