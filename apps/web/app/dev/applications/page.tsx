import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

const getApplications = cache(async () => {
  const session = await getSession();

  if(!session) {
    redirect('/login');
  }

  return db.application.findMany({
    where: { ownerId: session.userId },
    select: {
      id: true,
      name: true,
      imageId: true,
      authorizations: {
        select: { id: true },
        where: { OR: [{ expiresAt: { gte: new Date() }}, { expiresAt: null }], type: { in: ['AccessToken', 'RefreshToken'] }},
        distinct: 'userId'
      }
    },
  });
});

export default async function DevPage() {
  const applications = await getApplications();

  return (
    <PageLayout>
      <Headline id="applications" actions={<LinkButton href="/dev/applications/create" icon="add">Create</LinkButton>}>Your Applications</Headline>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Application</Table.HeaderCell>
            <Table.HeaderCell>Users</Table.HeaderCell>
            <Table.HeaderCell small>Actions</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td><FlexRow><ApplicationImage fileId={app.imageId}/>{app.name}</FlexRow></td>
              <td>{app.authorizations.length}</td>
              <td><LinkButton href={`/dev/applications/${app.id}`} icon="settings">Manage</LinkButton></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Your Applications'
};
