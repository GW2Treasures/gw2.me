/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import Link from 'next/link';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';
import { AuthorizationType } from '@gw2me/database';

const getUserData = cache(async () => {
  const session = await getUser();

  if(!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      authorizations: {
        where: { type: AuthorizationType.RefreshToken },
        include: { application: { select: { name: true }}},
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if(!user) {
    notFound();
  }

  return {
    sessionId: session.sessionId,
    user,
  };
});

export default async function ProfilePage() {
  const { sessionId, user } = await getUserData();

  return (
    <>
      <Headline id="applications">Authorized Apps</Headline>

      <p>Visit the <Link href="/discover">Discover</Link> page to find new applications using gw2.me.</p>

      {user.authorizations.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th>Application</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {user.authorizations.map((authorization) => (
              <tr key={authorization.id}>
                <td><img src={`/api/application/${authorization.applicationId}/image`} width={32} height={32} alt="" style={{ verticalAlign: -10, borderRadius: 2 }}/> {authorization.application.name}</td>
                <td>{authorization.usedAt?.toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Separator/>
      <p>Are you a developer? <Link href="/dev/applications">Manage your own applications</Link>.</p>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await getUserData();

  return {
    title: user.name,
  };
};
