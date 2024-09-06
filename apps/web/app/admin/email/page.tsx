import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import TestEmail from '@gw2me/emails/test';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { render } from '@react-email/render';

export default function EmailPage() {
  return (
    <PageLayout>
      <Headline id="email">Email</Headline>
      <Code>
        {render(<TestEmail/>, { pretty: false })}
      </Code>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Email'
};
