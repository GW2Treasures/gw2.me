import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ApplicationForm } from './form';
import { deleteClientSecret, generateClientSecret } from './_actions/secret';
import { PageProps } from '@/lib/next';
import { editOAuth2Clients } from './_actions/edit';

const getApplication = cache(async (id: string) => {
  const session = await getSessionOrRedirect();

  const application = await db.application.findFirst({
    where: { id, ownerId: session.userId },
    include: { clients: { include: { secrets: { select: { id: true, createdAt: true, usedAt: true }}}}}
  });

  if(!application) {
    notFound();
  }

  return application;
});

type EditApplicationPageProps = PageProps<{ id: string }>;

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const { id } = await params;
  const application = await getApplication(id);

  return (
    <>
      <p>Check the <a href="/dev/docs/manage-apps#client">documentation</a> for more information on how to manage your OAuth2 client.</p>

      <ApplicationForm applicationId={application.id} clients={application.clients}
        editApplicationAction={editOAuth2Clients.bind(null, application.id)}
        generateClientSecretAction={generateClientSecret}
        deleteClientSecretAction={deleteClientSecret}/>
    </>
  );
}

export async function generateMetadata({ params }: EditApplicationPageProps) {
  const { id } = await params;
  const application = await getApplication(id);

  return {
    title: `Edit ${application.name}`
  };
}
