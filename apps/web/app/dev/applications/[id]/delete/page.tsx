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

  const app = await db.application.findUnique({
    where: { id, ownerId: session.userId },
    select: { id: true, name: true }
  });

  if(!app) {
    notFound();
  }

  return app;
}

export default async function DeleteApplicationPage({ params }: { params: { id: string }}) {
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
