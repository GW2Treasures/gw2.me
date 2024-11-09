import { PageProps } from '@/lib/next';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AccountAddForm } from 'app/(user)/accounts/add/form';

export default async function AccountCreatePage({ searchParams }: PageProps) {
  const { return: returnTo } = await searchParams;

  return (
    <div>
      <Headline id="create">Add API Key</Headline>

      <AccountAddForm returnTo={Array.isArray(returnTo) ? returnTo[0] : returnTo}/>
    </div>
  );
}

export const metadata = {
  title: 'Add API Key'
};
