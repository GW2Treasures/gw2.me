import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { getSession } from '@/lib/session';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { redirect } from 'next/navigation';
import type { FC } from 'react';

export interface AddEmailFormProps {
  returnTo?: string;
}

export const AddEmailForm: FC<AddEmailFormProps> = ({ returnTo }) => {
  return (
    <Form action={addEmail.bind(null, returnTo)}>
      <Label label="Email"><TextInput name="email" type={'email' as 'text'}/></Label>
      <FlexRow>
        {returnTo && (<LinkButton href={returnTo}>Cancel</LinkButton>)}
        <SubmitButton icon="add">Add Email</SubmitButton>
      </FlexRow>
    </Form>
  );
};


const emailRegex = /^.+@.+$/;

async function addEmail(returnTo: undefined | string, _: FormState, formData: FormData): Promise<FormState> {
  'use server';

  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  const email = getFormDataString(formData, 'email');

  if(email === undefined || !emailRegex.test(email)) {
    return { error: 'Invalid email' };
  }

  try {
    await db.userEmail.create({
      data: { email, userId: session.userId }
    });
  } catch(e) {
    console.error(e);
    return { error: 'Could not save email' };
  }

  redirect(returnTo ?? '/profile');
}
