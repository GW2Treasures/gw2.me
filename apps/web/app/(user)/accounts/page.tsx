import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { AuthorizationType } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';
import { PageLayout } from '@/components/Layout/PageLayout';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';

const getAccounts = cache(async () => {
  const session = await getSession();

  if(!session) {
    redirect('/login');
  }

  const accounts = await db.account.findMany({
    where: { userId: session.userId },
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

  return { accounts };
});

export default async function ProfilePage() {
  const { accounts } = await getAccounts();

  if(accounts.length === 0) {
    redirect('/accounts/add');
  }

  const Accounts = createDataTable(accounts, ({ id }) => id);

  return (
    <PageLayout>
      <Headline id="accounts" actions={<LinkButton href="/accounts/add" icon="key-add">Add API Key</LinkButton>}>Guild Wars 2 Accounts</Headline>

      {accounts.length > 0 && (
        <Accounts.Table>
          <Accounts.Column title="Account" id="accounts">
            {({ displayName, accountName }) => <><Icon icon="user"/> <b>{displayName ?? accountName}</b> {displayName && `(${accountName})`}</>}
          </Accounts.Column>
          <Accounts.Column title="Verified" id="verified" sortBy={({ verified }) => verified ? 1 : 0}>
            {({ verified }) => <FlexRow><Icon icon={verified ? 'verified' : 'unverified'}/> {verified ? 'Verified' : 'Not Verified'}</FlexRow>}
          </Accounts.Column>
          <Accounts.Column title="Authorized Applications" id="apps" align="right" sortBy={({ _count }) => _count.authorizations}>
            {({ _count }) => _count.authorizations}
          </Accounts.Column>
          <Accounts.Column title="API Keys" id="keys" align="right" sortBy={({ _count }) => _count.authorizations}>
            {({ _count }) => _count.apiTokens}
          </Accounts.Column>
          <Accounts.Column small title="Actions" id="actions">
            {({ id, verified }) => (
              <FlexRow>
                <LinkButton href={`/accounts/${id}`} icon="settings">Manage</LinkButton>
                {!verified && (<LinkButton href={`/accounts/${id}/verify`} icon="verified">Verify</LinkButton>)}
              </FlexRow>
            )}
          </Accounts.Column>
        </Accounts.Table>
      )}
    </PageLayout>
  );
}

export const metadata = {
  title: 'Accounts'
};
