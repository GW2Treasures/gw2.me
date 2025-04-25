import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { Icon } from '@gw2treasures/ui';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import Link from 'next/link';
import { ensureUserIsAdmin } from '../admin';

function getSharedAccounts() {
  return db.sharedAccount.findMany({
    include: {
      user: { select: { id: true, name: true }},
      account: { select: { accountName: true, user: { select: { id: true, name: true }}}},
      _count: { select: { applicationGrants: true }},
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminAppsPage() {
  await ensureUserIsAdmin();
  const sharedAccounts = await getSharedAccounts();
  const SharedAccounts = createDataTable(sharedAccounts, (sharedAccount) => sharedAccount.id);

  return (
    <PageLayout>
      <Headline id="shared-accounts" actions={<ColumnSelection table={SharedAccounts}/>}>Shared Accounts ({sharedAccounts.length})</Headline>

      <SharedAccounts.Table>
        <SharedAccounts.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</SharedAccounts.Column>
        <SharedAccounts.Column id="owner" title="Owner" sortBy={({ account }) => account.user.name}>{({ account }) => <Link href={`/admin/users/${account.user.id}`}><FlexRow><Icon icon="user"/>{account.user.name}</FlexRow></Link>}</SharedAccounts.Column>
        <SharedAccounts.Column id="accountId" title="Account Id" hidden>{({ accountId }) => <Code inline borderless>{accountId}</Code>}</SharedAccounts.Column>
        <SharedAccounts.Column id="account" title="Account" sortBy={({ account }) => account.accountName}>{({ account }) => account.accountName}</SharedAccounts.Column>
        <SharedAccounts.Column id="user" title="User" sortBy={({ user }) => user.name}>{({ user }) => <Link href={`/admin/users/${user.id}`}><FlexRow><Icon icon="user"/>{user.name}</FlexRow></Link>}</SharedAccounts.Column>
        <SharedAccounts.Column id="grants" title="Applications" sortBy={({ _count }) => _count.applicationGrants} align="right">{({ _count }) => _count.applicationGrants}</SharedAccounts.Column>
        <SharedAccounts.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</SharedAccounts.Column>
      </SharedAccounts.Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Shared Accounts'
};
