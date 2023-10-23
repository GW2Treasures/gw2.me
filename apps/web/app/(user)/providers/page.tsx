/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { PageLayout } from '@/components/Layout/PageLayout';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Button } from '@gw2treasures/ui/components/Form/Button';

const getUserData = cache(async () => {
  const session = await getUser();

  if(!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: { sessions: true, providers: true },
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
    <PageLayout>
      <Headline id="providers">Login Providers</Headline>

      <p>More providers coming soon.</p>

      <Table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>User</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {user.providers.map((provider) => (
            <tr key={`${provider.provider}-${provider.providerAccountId}`}>
              <td>{provider.provider}</td>
              <td>{provider.displayName}</td>
              <td>{provider.createdAt.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <form method="POST">
        <FlexRow>
          <Button type="submit" formAction="/auth/login/discord">Add Discord</Button>
        </FlexRow>
      </form>

      <Headline id="sessions">Sessions</Headline>
      <Table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Started</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <tbody>
          {user.sessions.map((session) => (
            <tr key={session.id}>
              <td>{session.info}{session.id === sessionId && ' (Current Session)'}</td>
              <td>{session.createdAt.toISOString()}</td>
              <td>{session.lastUsed.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Login Providers'
};
