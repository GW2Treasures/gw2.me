import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { notFound } from 'next/navigation';
import { cache } from 'react';

const getApplication = cache(async (id: string) => {
  const user = await getUser();

  if(!user) {
    notFound();
  }

  return db.application.findFirst({ where: { id, ownerId: user.id }});
});

export default async function EditApplicationPage({ params }: { params: { id: string }}) {
  const application = await getApplication(params.id);

  if(!application) {
    notFound();
  }

  return (
    <div>
      <h1>{application.name}</h1>

      <pre>{JSON.stringify(application, undefined, 2)}</pre>

    </div>
  );
}
