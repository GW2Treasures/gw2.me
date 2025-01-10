import { PageProps } from '@/lib/next';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AddEmailForm } from 'app/(user)/emails/add/form';

export default async function AccountCreatePage({ searchParams }: PageProps) {
  const { return: returnTo } = await searchParams;

  return (
    <div>
      <Headline id="add">Add Email</Headline>

      <AddEmailForm returnTo={Array.isArray(returnTo) ? returnTo[0] : returnTo}/>
    </div>
  );
}

export const metadata = {
  title: 'Add Email'
};
