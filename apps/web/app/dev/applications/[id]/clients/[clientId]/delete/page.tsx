import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { deleteClient } from '../../_actions/delete';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { getSessionOrRedirect } from '@/lib/session';
import { getApplicationById } from '../../../helper';
import { cache } from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';


const getClient = cache((clientId: string, applicationId: string, ownerId: string) => {
  return db.client.findFirst({
    where: { id: clientId, applicationId, application: { ownerId }},
  });
});

export default async function DeleteClientPage({ params }: PageProps<'/dev/applications/[id]/clients/[clientId]/delete'>) {
  const { id: applicationId, clientId } = await params;
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(applicationId, session.userId);
  const client = await getClient(clientId, applicationId, session.userId);

  if(!client) {
    notFound();
  }

  return (
    <Form action={deleteClient.bind(null, application.id, client.id)}>
      <p>Are your sure you want to delete the client {client.name}? All active authorizations will be deleted as well.</p>

      <FlexRow>
        <LinkButton href={`/dev/applications/${application.id}/clients/${client.id}`}>Cancel</LinkButton>
        <SubmitButton icon="delete" intent="delete">Delete Client</SubmitButton>
      </FlexRow>
    </Form>
  );
}


export async function generateMetadata({ params }: PageProps<'/dev/applications/[id]/clients/[clientId]/delete'>): Promise<Metadata> {
  const { id: applicationId, clientId } = await params;
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(applicationId, session.userId);
  const client = await getClient(clientId, applicationId, session.userId);

  if(!client) {
    notFound();
  }

  return {
    title: `Edit ${application.name} / Clients / Delete ${client.name}`
  };
}
