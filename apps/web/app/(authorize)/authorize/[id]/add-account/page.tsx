import { PageProps } from '@/lib/next';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AccountAddForm } from 'app/(user)/accounts/add/form';

export default async function AuthorizeAddAccountPage({ params }: PageProps<{ id: string }>) {
  const { id } = await params;

  return (
    <div>
      <Headline id="create">Add API Key</Headline>

      <AccountAddForm returnTo={`/authorize/${id}`}/>
    </div>
  );
}

export const metadata = {
  title: 'Add API Key'
};
