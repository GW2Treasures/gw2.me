import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { AddEmailForm } from 'app/(user)/emails/add/form';
import { Metadata } from 'next';

export default async function AuthorizeAddEmailPage({ params }: PageProps<'/authorize/[id]/add-email'>) {
  const { id } = await params;

  return (
    <div>
      <Headline id="add">Add Email</Headline>

      <AddEmailForm returnTo={`/authorize/${id}`}/>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Add Email'
};
