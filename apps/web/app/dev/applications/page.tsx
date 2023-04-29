import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
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
      <Headline id="applications" actions={<LinkButton href="/dev/applications/create">Create</LinkButton>}>Your Applications</Headline>

      <ul>
        {applications.map((app) => (
          <li key={app.id}><Link href={`/dev/applications/${app.id}`}>{app.name}</Link></li>
        ))}
      </ul>
    </div>
  );
}
