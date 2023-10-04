/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import Link from 'next/link';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { AuthorizationType } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';

const getUserData = cache(async () => {
  const session = await getUser();

  if(!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      sessions: true,
      providers: true,
      authorizations: {
        where: { type: AuthorizationType.RefreshToken },
        include: { application: { select: { name: true }}},
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if(!user) {
    redirect('/login');
  }

  const accounts = await db.account.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: {
          authorizations: { where: { type: AuthorizationType.AccessToken }},
          apiTokens: true
        }
      }
    },
  });

  return {
    sessionId: session.sessionId,
    user,
    accounts,
  };
});

export default async function ProfilePage() {
  const { sessionId, user, accounts } = await getUserData();

  return (
    <div>
      <Headline id="profile">{user.name}</Headline>
      <LinkButton href="/logout" external>Logout</LinkButton>

      <Headline id="accounts">Guild Wars 2 Accounts</Headline>
      <LinkButton href="/accounts/add" icon="key-add">Add API Key</LinkButton>
      {accounts.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Table.HeaderCell>Account</Table.HeaderCell>
              <Table.HeaderCell>Authorized Applications</Table.HeaderCell>
              <Table.HeaderCell>API Keys</Table.HeaderCell>
              <Table.HeaderCell small>Actions</Table.HeaderCell>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td><Icon icon="user"/> <b>{account.displayName ?? account.accountName}</b> {account.displayName && `(${account.accountName})`}</td>
                <td>{account._count.authorizations}</td>
                <td>{account._count.apiTokens}</td>
                <td><LinkButton href={`/accounts/${account.id}`} icon="settings">Manage</LinkButton></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Headline id="providers">Login Providers</Headline>
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

      <Headline id="applications">Authorized Apps</Headline>
      <p>Are you a developer? <Link href="/dev/applications">Manage your own apps</Link>.</p>

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
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await getUserData();

  return {
    title: user.name,
  };
};
