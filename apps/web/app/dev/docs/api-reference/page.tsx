import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export default function DevDocsApiReferencePage() {
  return (
    <PageLayout>
      <PageTitle>API Reference</PageTitle>
      <Notice type="error">The API Reference is not yet available</Notice>
    </PageLayout>
  );
}

export const metadata = {
  title: 'API Reference',
};
