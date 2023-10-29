import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { PageLayout } from '@/components/Layout/PageLayout';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { revalidatePath } from 'next/cache';
import { FormatDate } from '@/components/Format/FormatDate';

const getUserData = cache(async () => {
  const session = await getSession();

  if(!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { sessions: true, providers: true },
  });

  if(!user) {
    notFound();
  }

  return {
    session,
    user,
  };
});

export default async function ProfilePage() {
  const { session: currentSession, user } = await getUserData();

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
              <td><FormatDate date={provider.createdAt}/></td>
            </tr>
          ))}
        </tbody>
      </Table>

      <form method="POST">
        <input type="hidden" name="type" value="add"/>
        <FlexRow>
          <Button type="submit" formAction="/auth/login/discord">Add Discord</Button>
        </FlexRow>
      </form>

      <Headline id="sessions" actions={<form action={revokeAllSessions}><Button type="submit" icon="delete">Revoke all</Button></form>}>Sessions</Headline>
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
              <td>{session.info}{session.id === currentSession.id && ' (Current Session)'}</td>
              <td><FormatDate date={session.createdAt}/></td>
              <td><FormatDate date={session.lastUsed}/></td>
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

async function revokeAllSessions() {
  'use server';

  const session = await getSession();

  if(!session) {
    return;
  }

  await db.userSession.deleteMany({
    where: { id: { not: session.id }, userId: session.userId }
  });

  revalidatePath('/providers');
}
