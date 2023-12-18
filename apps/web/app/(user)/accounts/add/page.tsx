import { PageLayout } from '@/components/Layout/PageLayout';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AccountAddForm } from './form';

export default function AccountCreatePage() {
  return (
    <PageLayout>
      <Headline id="create">Add API Key</Headline>

      <AccountAddForm/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Add API Key'
};
