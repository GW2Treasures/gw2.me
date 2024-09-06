import { PageLayout } from '@/components/Layout/PageLayout';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AddEmailForm } from './form';

export default function EmailsAddPage() {
  return (
    <PageLayout>
      <Headline id="add">Add Email</Headline>

      <AddEmailForm/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Add Email'
};
