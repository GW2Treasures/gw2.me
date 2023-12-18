import { PageLayout } from '@/components/Layout/PageLayout';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AccountAddForm } from 'app/(user)/accounts/add/form';

export default function ApiKeyVerifiyAccountPage() {
  return (
    <PageLayout>
      <Headline id="verify">Verify Account</Headline>

      <AccountAddForm requireVerification/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Verify Account (API key)'
};
