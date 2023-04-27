import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

const getApplications = cache(async () => {
  const user = await getUser();

  if(!user) {
    notFound();
  }

  return db.application.findMany({ where: { ownerId: user.id }});
});


export default async function DevPage() {
  const applications = await getApplications();

  return (
    <div>
      <h1>Your Applications</h1>

      <Link href="/dev/applications/create">Create new Application</Link>

      <ul>
        {applications.map((app) => (
          <li key={app.id}><Link href={`/dev/applications/${app.id}`}>{app.name}</Link></li>
        ))}
      </ul>
    </div>
  );
}
