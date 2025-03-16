import { PageProps } from '@/lib/next';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AddEmailForm } from 'app/(user)/emails/add/form';

export default async function AuthorizeAddEmailPage({ params }: PageProps<{ id: string }>) {
  const { id } = await params;

  return (
    <div>
      <Headline id="add">Add Email</Headline>

      <AddEmailForm returnTo={`/authorize/${id}`}/>
    </div>
  );
}

export const metadata = {
  title: 'Add Email'
};
