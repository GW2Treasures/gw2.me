import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { PageLayout } from '@/components/Layout/PageLayout';
import { ApplicationForm } from './form';
import { editApplication } from '../_actions/edit';
import { deleteClientSecret, generateClientSecret } from '../_actions/secret';
import { PageProps } from '@/lib/next';

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

  const emails = await db.userEmail.findMany({
    where: { userId: application.ownerId, verified: true },
  });

  return (
    <PageLayout>
      <Headline id="app">{application.name}</Headline>

      <ApplicationForm application={application} applicationId={application.id} emails={emails} clients={application.clients}
        editApplicationAction={editApplication.bind(null, application.id)}
        generateClientSecretAction={generateClientSecret}
        deleteClientSecretAction={deleteClientSecret}/>
    </PageLayout>
  );
}

export async function generateMetadata({ params }: EditApplicationPageProps) {
  const { id } = await params;
  const application = await getApplication(id);

  return {
    title: `Edit ${application.name}`
  };
}
