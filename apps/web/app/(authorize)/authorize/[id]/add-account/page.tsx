import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AccountAddForm } from 'app/(user)/accounts/add/form';
import { Metadata } from 'next';

export default async function AuthorizeAddAccountPage({ params }: PageProps<'/authorize/[id]/add-account'>) {
  const { id } = await params;

  return (
    <div>
      <Headline id="create">Add API Key</Headline>

      <AccountAddForm returnTo={`/authorize/${id}`}/>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Add API Key'
};
