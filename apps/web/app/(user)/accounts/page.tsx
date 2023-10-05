/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { AuthorizationType } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';

const getAccounts = cache(async () => {
  const user = await getUser();

  if(!user) {
    redirect('/login');
  }

  const accounts = await db.account.findMany({
    where: { userId: user.id },
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
    user,
    accounts,
  };
});

export default async function ProfilePage() {
  const { accounts } = await getAccounts();

  if(accounts.length === 0) {
    redirect('/accounts/add');
  }

  return (
    <>
      <Headline id="accounts" actions={<LinkButton href="/accounts/add" icon="key-add">Add API Key</LinkButton>}>Guild Wars 2 Accounts</Headline>

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
    </>
  );
}

export const metadata = {
  title: 'Accounts'
};
