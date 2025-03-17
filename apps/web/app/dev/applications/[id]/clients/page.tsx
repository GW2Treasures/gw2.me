import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { ApplicationForm } from './form';
import { deleteClientSecret, generateClientSecret } from './_actions/secret';
import { PageProps } from '@/lib/next';
import { editOAuth2Clients } from './_actions/edit';
import { getApplicationById } from '../layout';

const getClients = (applicationId: string, ownerId: string) => {
  return db.client.findMany({
    where: { applicationId, application: { ownerId }},
    include: { secrets: { select: { id: true, createdAt: true, usedAt: true }}}
  });
};

type EditApplicationPageProps = PageProps<{ id: string }>;

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const clients = await getClients(id, session.userId);

  return (
    <>
      <p>Check the <a href="/dev/docs/manage-apps#client">documentation</a> for more information on how to manage your OAuth2 client.</p>

      <ApplicationForm applicationId={id} clients={clients}
        editApplicationAction={editOAuth2Clients.bind(null, id)}
        generateClientSecretAction={generateClientSecret}
        deleteClientSecretAction={deleteClientSecret}/>
    </>
  );
}

export async function generateMetadata({ params }: EditApplicationPageProps) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(id, session.userId);

  return {
    title: `Edit ${application.name} / Clients`
  };
}
