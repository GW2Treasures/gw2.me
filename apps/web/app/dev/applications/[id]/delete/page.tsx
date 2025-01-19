import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { deleteApplication } from './actions';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { notFound } from 'next/navigation';
import { PageProps } from '@/lib/next';

async function getApplication(id: string) {
  const session = await getSessionOrRedirect();

  const application = await db.application.findUnique({
    where: { id, ownerId: session.userId },
    select: { id: true, name: true }
  });

  if(!application) {
    notFound();
  }

  return application;
}

type DeleteApplicationPageProps = PageProps<{ id: string; }>;

export default async function DeleteApplicationPage({ params }: DeleteApplicationPageProps) {
  const { id } = await params;
  const app = await getApplication(id);

  return (
    <Form action={deleteApplication.bind(null, app.id)}>
      <p>Are your sure you want to delete {app.name}?</p>

      <FlexRow>
        <LinkButton href={`/dev/applications/${app.id}`}>Cancel</LinkButton>
        <SubmitButton icon="delete" intent="delete">Delete Application</SubmitButton>
      </FlexRow>
    </Form>
  );
}


export async function generateMetadata({ params }: DeleteApplicationPageProps) {
  const { id } = await params;
  const application = await getApplication(id);

  return {
    title: `Delete ${application.name}`
  };
}
