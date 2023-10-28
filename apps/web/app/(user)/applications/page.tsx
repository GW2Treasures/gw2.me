import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import Link from 'next/link';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Prisma } from '@gw2me/database';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { Form } from '@/components/Form/Form';
import { revokeAccess } from './actions';
import { PageLayout } from '@/components/Layout/PageLayout';

const getUserData = cache(async () => {
  const session = await getSession();

  if(!session) {
    redirect('/login');
  }

  const authorizationFilter: Prisma.AuthorizationWhereInput = {
    userId: session.userId,
    OR: [
      { expiresAt: { gte: new Date() }},
      { expiresAt: null }
    ],
  };

  const applications = await db.application.findMany({
    where: { authorizations: { some: authorizationFilter }},
    select: {
      id: true,
      name: true,
      imageId: true,

      // include the last used authorization
      authorizations: {
        take: 1,
        where: { ...authorizationFilter, usedAt: { not: null }},
        orderBy: { usedAt: 'desc' },
        select: { usedAt: true }
      }
    }
  });

  return {
    applications
  };
});

export default async function ProfilePage() {
  const { applications } = await getUserData();

  return (
    <PageLayout>
      <Headline id="applications">Authorized Applications</Headline>

      <p>Visit the <Link href="/discover">Discover</Link> page to find new applications using gw2.me.</p>

      <Form action={revokeAccess}>
        {applications.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Table.HeaderCell>Application</Table.HeaderCell>
                <Table.HeaderCell>Last Used</Table.HeaderCell>
                <Table.HeaderCell small>Actions</Table.HeaderCell>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td><FlexRow><ApplicationImage fileId={application.imageId}/> {application.name}</FlexRow></td>
                  <td>{application.authorizations[0]?.usedAt?.toISOString() ?? 'never'}</td>
                  <td><Button type="submit" name="applicationId" value={application.id} intent="delete" icon="delete">Revoke Access</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Separator/>
        <p>Are you a developer? <Link href="/dev/applications">Manage your own applications</Link>.</p>
      </Form>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Applications'
};
