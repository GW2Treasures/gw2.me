import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ApplicationForm } from './form';
import { editApplication } from '../../_actions/edit';
import { PageProps } from '@/lib/next';

const getApplication = cache(async (id: string) => {
  const session = await getSessionOrRedirect();

  const application = await db.application.findFirst({
    where: { id, ownerId: session.userId }
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
    <>
      <p>Check the <a href="/dev/docs/manage-apps#settings">documentation</a> for more information on how to manage your application.</p>

      <ApplicationForm application={application} applicationId={application.id} emails={emails}
        editApplicationAction={editApplication.bind(null, application.id)}/>
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
