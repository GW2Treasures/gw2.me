import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { deleteApplication } from '../_actions/delete';

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
      <Link href="/dev/applications">← List of Applications</Link>
      <h1>{application.name}</h1>

      <pre>{JSON.stringify(application, undefined, 2)}</pre>

      <form method="POST" action="">
        <input type="hidden" name="$$id" value={deleteApplication.$$id}/>
        <input type="hidden" name="id" value={application.id}/>
        <button>Delete Application</button>
      </form>
    </div>
  );
}
