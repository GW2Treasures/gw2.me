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
import { DiscordIcon } from 'app/auth/discord';
import { GitHubIcon } from 'app/auth/github';
import { SteamIcon } from 'app/auth/steam';
import { GoogleIcon } from 'app/auth/google';
import { UserProviderType } from '@gw2me/database';
import { providers as availableProviders } from 'app/auth/providers';

const getUserData = cache(async () => {
  const currentSession = await getSession();

  if(!currentSession) {
    redirect('/login');
  }

  const [sessions, providers] = await Promise.all([
    db.userSession.findMany({
      where: { userId: currentSession.userId },
      orderBy: { lastUsed: 'desc' }
    }),

    db.userProvider.findMany({
      where: { userId: currentSession.userId },
      orderBy: { createdAt: 'asc' }
    }),
  ]);

  return {
    currentSession,
    sessions,
    providers
  };
});

export default async function ProfilePage() {
  const { currentSession, sessions, providers } = await getUserData();

  return (
    <PageLayout>
      <Headline id="providers">Login Providers</Headline>

      <p>Add additional login providers to make sure you can always login.</p>

      <Table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>User</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={`${provider.provider}-${provider.providerAccountId}`}>
              <td>
                {
                  provider.provider === 'discord' ? <FlexRow><DiscordIcon/>Discord</FlexRow> :
                  provider.provider === 'github' ? <FlexRow><GitHubIcon/>GitHub</FlexRow> :
                  provider.provider === 'steam' ? <FlexRow><SteamIcon/>Steam</FlexRow> :
                  provider.provider === 'google' ? <FlexRow><GoogleIcon/>Google</FlexRow> :
                  provider.provider
                }
              </td>
              <td>{provider.displayName}</td>
              <td><FormatDate date={provider.createdAt}/></td>
            </tr>
          ))}
        </tbody>
      </Table>

      <form method="POST">
        <input type="hidden" name="type" value="add"/>
        <FlexRow>
          {availableProviders[UserProviderType.discord] && (<Button type="submit" formAction="/auth/login/discord" icon={<DiscordIcon/>}>Add Discord</Button>)}
          {availableProviders[UserProviderType.google] && (<Button type="submit" formAction="/auth/login/google" icon={<GoogleIcon/>}>Add Google</Button>)}
          {availableProviders[UserProviderType.github] && (<Button type="submit" formAction="/auth/login/github" icon={<GitHubIcon/>}>Add GitHub</Button>)}
          {availableProviders[UserProviderType.steam] && (<Button type="submit" formAction="/auth/login/steam" icon={<SteamIcon/>}>Add Steam</Button>)}
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
          {sessions.map((session) => (
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
