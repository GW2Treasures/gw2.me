import { PageLayout } from '@/components/Layout/PageLayout';
import { searchParamsToURLSearchParams } from '@/lib/next';
import { Icon } from '@gw2treasures/ui';
import { ResolveFedCM } from './ResolveFedCM';

export default async function Page({ searchParams }: PageProps<'/fed-cm/authorize'>) {
  const code = searchParamsToURLSearchParams(await searchParams).get('code');

  return (
    <PageLayout thin>
      <div style={{ '--icon-size': '64px' }}>
        <Icon icon="loading" color="var(--color-brand)"/>
      </div>
      <ResolveFedCM code={code}/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Authorize'
};
