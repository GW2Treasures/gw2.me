import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getApplicationById } from '../../helper';
import { editOAuth2Client } from '../_actions/edit';
import { deleteClientSecret, generateClientSecret } from '../_actions/secret';
import { ClientForm } from '../form';
import { Metadata } from 'next';

const getClient = cache((clientId: string, applicationId: string, ownerId: string) => {
  return db.client.findFirst({
    where: { id: clientId, applicationId, application: { ownerId }},
    include: { secrets: { select: { id: true, createdAt: true, usedAt: true }}}
  });
});

export default async function EditApplicationPage({ params }: PageProps<'/dev/applications/[id]/clients/[clientId]'>) {
  const { id: applicationId, clientId } = await params;
  const session = await getSessionOrRedirect();
  const client = await getClient(clientId, applicationId, session.userId);

  if(!client) {
    notFound();
  }

  return (
    <>
      <p>Check the <a href="/dev/docs/manage-apps#client">documentation</a> for more information on how to manage your OAuth2 clients.</p>

      <ClientForm applicationId={applicationId} client={client}
        editApplicationAction={editOAuth2Client.bind(null, applicationId, client.id)}
        generateClientSecretAction={generateClientSecret}
        deleteClientSecretAction={deleteClientSecret}/>
    </>
  );
}

export async function generateMetadata({ params }: PageProps<'/dev/applications/[id]/clients/[clientId]'>): Promise<Metadata> {
  const { id: applicationId, clientId } = await params;
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(applicationId, session.userId);
  const client = await getClient(clientId, applicationId, session.userId);

  if(!client) {
    notFound();
  }

  return {
    title: `Edit ${application.name} / Clients / ${client.name}`
  };
}
