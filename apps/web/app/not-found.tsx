import { PageLayout } from '@/components/Layout/PageLayout';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';

export default function NotFoundPage() {
  return (
    <PageLayout>
      <Headline id="404">Not found</Headline>

      <p>We could not find the requested page.</p>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Not found'
};
