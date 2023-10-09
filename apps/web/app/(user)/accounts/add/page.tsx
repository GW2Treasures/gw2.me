import { PageLayout } from '@/components/Layout/PageLayout';
import { AccountAddForm } from './form';

export interface AccountCreatePageProps {
  searchParams?: {
    return?: string;
  }
}

export default function AccountCreatePage({ searchParams }: AccountCreatePageProps) {
  return (
    <PageLayout>
      <AccountAddForm returnTo={searchParams?.return}/>
    </PageLayout>
  );
}
