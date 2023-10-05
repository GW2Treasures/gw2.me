import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

const getApplications = cache(async () => {
  const user = await getUser();

  if(!user) {
    redirect('/login');
  }

  return db.application.findMany({ where: { ownerId: user.id }});
});


export default async function DevPage() {
  const applications = await getApplications();

  return (
    <div>
      <Headline id="applications" actions={<LinkButton href="/dev/applications/create">Create</LinkButton>}>Your Applications</Headline>

      <Table>
        <thead>
          <tr>
            <th>Application</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td><Link href={`/dev/applications/${app.id}`}>{app.name}</Link></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
