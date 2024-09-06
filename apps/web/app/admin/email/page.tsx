import { PageLayout } from '@/components/Layout/PageLayout';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { sendMail } from '@/lib/mail';
import TestEmail from '@gw2me/emails/test';

export default function EmailPage() {
  return (
    <PageLayout>
      <Headline id="email">Email</Headline>
      <form action={send}>
        <SubmitButton icon="mail">Send Test mail</SubmitButton>
      </form>
    </PageLayout>
  );
}

async function send() {
  'use server';

  const message = await sendMail('Test Mail', 'gw2me@darthmaim.de', <TestEmail/>);

  console.log(message);
}

export const metadata = {
  title: 'Email'
};
