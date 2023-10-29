import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { deleteApplication } from '../../_actions/delete';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { Form } from '@/components/Form/Form';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { PageLayout } from '@/components/Layout/PageLayout';

async function getApplication(id: string) {
  const session = await getSession();

  if(!session) {
    redirect('/login');
  }

  const application = await db.application.findUnique({
    where: { id, ownerId: session.userId },
    select: { id: true, name: true }
  });

  if(!application) {
    notFound();
  }

  return application;
}

interface DeleteApplicationPageProps {
  params: {
    id: string;
  };
}

export default async function DeleteApplicationPage({ params }: DeleteApplicationPageProps) {
  const app = await getApplication(params.id);

  return (
    <PageLayout>
      <Form action={deleteApplication.bind(null, app.id)}>
        <Headline id="delete">{app.name}</Headline>

        <p>Are your sure you want to delete {app.name}?</p>

        <FlexRow>
          <LinkButton href={`/dev/applications/${app.id}`}>Cancel</LinkButton>
          <SubmitButton icon="delete" intent="delete">Delete Application</SubmitButton>
        </FlexRow>
      </Form>
    </PageLayout>
  );
}


export async function generateMetadata({ params }: DeleteApplicationPageProps) {
  const application = await getApplication(params.id);

  return {
    title: `Delete ${application.name}`
  };
}
