import { PageLayout } from '@/components/Layout/PageLayout';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { sendMail } from '@/lib/mail';
import TestEmail from '@gw2me/emails/test';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { getFormDataString } from '@/lib/form-data';
import { ensureUserIsAdmin } from '../admin';

export default async function EmailPage() {
  await ensureUserIsAdmin();

  return (
    <PageLayout>
      <Headline id="email">Email</Headline>
      <Form action={send}>
        <FlexRow>
          <TextInput type={'email' as 'text'} name="email" defaultValue="darthmaim@gw2.me"/>
          <SubmitButton icon="mail">Send Test mail</SubmitButton>
        </FlexRow>
      </Form>
    </PageLayout>
  );
}

async function send(_: FormState, formData: FormData): Promise<FormState> {
  'use server';
  await ensureUserIsAdmin();

  const email = getFormDataString(formData, 'email');

  if(!email) {
    return { error: 'Invalid email' };
  }

  try {
    await sendMail('Test Mail', email, <TestEmail/>);
  } catch(e) {
    return { error: `Error: ${e}` };
  }

  return { success: 'Email sent' };
}

export const metadata = {
  title: 'Email'
};
