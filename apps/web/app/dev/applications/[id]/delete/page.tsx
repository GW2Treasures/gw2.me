import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { deleteApplication } from './actions';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { getSessionOrRedirect } from '@/lib/session';
import { PageProps } from '@/lib/next';
import { getApplicationById } from '../helper';

type DeleteApplicationPageProps = PageProps<{ id: string; }>;

export default async function DeleteApplicationPage({ params }: DeleteApplicationPageProps) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const app = await getApplicationById(id, session.userId);

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
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(id, session.userId);

  return {
    title: `Delete ${application.name}`
  };
}
