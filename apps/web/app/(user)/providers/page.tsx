import { getSession, getSessionOrRedirect } from '@/lib/session';
import { db } from '@/lib/db';
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
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { login } from 'app/login/action';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { LoginError, getLoginErrorCookieValue } from 'app/login/form';
import { AddPasskeyButton } from '@/components/Passkey/AddPasskeyButton';
import { Icon } from '@gw2treasures/ui';

const getUserData = cache(async () => {
  const currentSession = await getSessionOrRedirect();

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
  const providerError = getLoginErrorCookieValue();

  const Providers = createDataTable(providers, ({ provider, providerAccountId }) => `${provider}.${providerAccountId}`);

  return (
    <PageLayout>
      <Headline id="providers">Login Providers</Headline>

      <p>Add additional login providers to make sure you can always login.</p>

      <Providers.Table>
        <Providers.Column id="provider" title="Provider" sortBy="provider">
          {({ provider }) =>
            provider === 'discord' ? <FlexRow><DiscordIcon/>Discord</FlexRow> :
            provider === 'github' ? <FlexRow><GitHubIcon/>GitHub</FlexRow> :
            provider === 'steam' ? <FlexRow><SteamIcon/>Steam</FlexRow> :
            provider === 'google' ? <FlexRow><GoogleIcon/>Google</FlexRow> :
            provider === 'passkey' ? <FlexRow><Icon icon="passkey"/>Passkey</FlexRow> :
            provider
          }
        </Providers.Column>
        <Providers.Column id="user" title="User" sortBy="displayName">{({ displayName }) => displayName}</Providers.Column>
        <Providers.Column id="createdAt" title="Created" sortBy="createdAt" align="right">
          {({ createdAt }) => <FormatDate date={createdAt}/>}
        </Providers.Column>
        <Providers.Column id="usedAt" title="Last Used" sortBy="usedAt" align="right">
          {({ usedAt }) => usedAt ? <FormatDate date={usedAt}/> : 'never'}
        </Providers.Column>
      </Providers.Table>

      <Form action={login.bind(null, 'add', {})}>
        {providerError === LoginError.Unknown && (<Notice type="error">Unknown error</Notice>)}
        {providerError === LoginError.WrongUser && (<Notice type="error">The login provider you tried to add is already linked to a different user.</Notice>)}

        <FlexRow wrap>
          <AddPasskeyButton/>
          {availableProviders[UserProviderType.discord] && (<Button type="submit" name="provider" value="discord" icon={<DiscordIcon/>}>Add Discord</Button>)}
          {availableProviders[UserProviderType.google] && (<Button type="submit" name="provider" value="google" icon={<GoogleIcon/>}>Add Google</Button>)}
          {availableProviders[UserProviderType.github] && (<Button type="submit" name="provider" value="github" icon={<GitHubIcon/>}>Add GitHub</Button>)}
          {availableProviders[UserProviderType.steam] && (<Button type="submit" name="provider" value="steam" icon={<SteamIcon/>}>Add Steam</Button>)}
        </FlexRow>
      </Form>

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
