import { getSessionOrRedirect } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Icon } from '@gw2treasures/ui';
import { PageLayout } from '@/components/Layout/PageLayout';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { SharedAccountState } from '@gw2me/database';
import { manageSharedAccount } from './actions';
import { Form } from '@gw2treasures/ui/components/Form/Form';

const getAccounts = cache(async () => {
  const session = await getSessionOrRedirect();

  const [accounts, sharedAccounts] = await Promise.all([
    db.account.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            applicationGrants: true,
            apiTokens: true
          }
        }
      },
    }),
    db.sharedAccount.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'asc' },
      include: {
        account: { select: { accountName: true, user: { select: { name: true }}}},
        _count: {
          select: {
            applicationGrants: true,
          }
        }
      }
    }),
  ]);

  return { accounts, sharedAccounts };
});

export default async function ProfilePage() {
  const { accounts, sharedAccounts } = await getAccounts();

  if(accounts.length === 0) {
    redirect('/accounts/add');
  }

  const Accounts = createDataTable(accounts, ({ id }) => id);
  const SharedAccounts = createDataTable(sharedAccounts, ({ id }) => id);

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
          <Accounts.Column title="Authorized Applications" id="apps" align="right" sortBy={({ _count }) => _count.applicationGrants}>
            {({ _count }) => _count.applicationGrants}
          </Accounts.Column>
          <Accounts.Column title="API Keys" id="keys" align="right" sortBy={({ _count }) => _count.apiTokens}>
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

      <Headline id="shared">Shared Accounts</Headline>
      <p>Other users can share accounts with you. To share your own accounts, click &quot;Manage&quot; in the table above.</p>

      <Form action={manageSharedAccount}>
        {sharedAccounts.length > 0 && (
          <SharedAccounts.Table>
            <SharedAccounts.Column id="accountName" title="Account">{({ account }) => account.accountName}</SharedAccounts.Column>
            <SharedAccounts.Column id="owner" title="Owner">{({ account }) => account.user.name}</SharedAccounts.Column>
            <SharedAccounts.Column id="apps" title="Authorized Applications" sortBy={({ _count }) => _count.applicationGrants}>{({ _count }) => _count.applicationGrants}</SharedAccounts.Column>
            <SharedAccounts.Column id="actions" title="Actions" small>
              {({ id, state }) => (
                <FlexRow>
                  {state === SharedAccountState.Pending && <Button icon="checkmark" type="submit" name="acceptSharedAccountId" value={id}>Accept</Button>}
                  <Button icon="cancel" type="submit" name="deleteSharedAccountId" value={id}>{state === SharedAccountState.Pending ? 'Decline' : 'Remove'}</Button>
                </FlexRow>
              )}
            </SharedAccounts.Column>
          </SharedAccounts.Table>
        )}
      </Form>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Accounts'
};
