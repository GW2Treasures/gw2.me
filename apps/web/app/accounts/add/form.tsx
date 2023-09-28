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
    <form action={action}>
      <Headline id="create">Add Account</Headline>
      {state.message && (
        <div style={{ padding: 16, background: '#b7000d', color: '#fff', marginBottom: 16, borderRadius: 2 }}>
          {state.message}
        </div>
      )}
      <Steps>
        <div>Visit the <a href="https://account.arena.net/applications">Guild Wars 2 Account Page</a></div>
        <div>Generate a new API key</div>
        <div>
          Paste your key into this form
          <div style={{ display: 'flex', marginBlock: 8 }}>
            <TextInput placeholder="API key" name="api-key"/>
          </div>
          <Button type="submit">Submit</Button>
          <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, fontSize: 14 }}>
            <div>gw2.me will only be able to read data of your account provided by the official API.</div>
            <div>gw2.me will NOT be able to write any data to your account.</div>
            <div>gw2.me will NOT share your API Key with any 3rd party without asking for your explicit permission first.</div>
            <div>You can remove access at any time by deleting the API key.</div>
          </div>
        </div>
      </Steps>
    </form>
  );
};
