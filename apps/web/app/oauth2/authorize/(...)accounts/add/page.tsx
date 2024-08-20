import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AccountAddForm } from 'app/(user)/accounts/add/form';

export interface AccountCreatePageProps {
  searchParams?: {
    return?: string;
  }
}

export default function AccountCreatePage({ searchParams }: AccountCreatePageProps) {
  return (
    <div>
      <Headline id="create">Add API Key</Headline>

      <AccountAddForm returnTo={searchParams?.return}/>
    </div>
  );
}

export const metadata = {
  title: 'Add API Key'
};
