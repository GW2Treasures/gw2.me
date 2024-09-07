import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AddEmailForm } from 'app/(user)/emails/add/form';

export interface AccountCreatePageProps {
  searchParams?: {
    return?: string;
  }
}

export default function AccountCreatePage({ searchParams }: AccountCreatePageProps) {
  return (
    <div>
      <Headline id="add">Add Email</Headline>

      <AddEmailForm returnTo={searchParams?.return}/>
    </div>
  );
}

export const metadata = {
  title: 'Add Email'
};
