import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { Icon } from '@gw2treasures/ui';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import Link from 'next/link';
import { ensureUserIsAdmin } from '../admin';
import { Permission } from '@gw2api/types/data/tokeninfo';
import { PermissionCount } from '@/components/Permissions/PermissionCount';

function getApiKeys() {
  return db.apiToken.findMany({
    include: {
      account: {
        select: {
          accountId: true,
          accountName: true,
          displayName: true,
          verified: true,
          userId: true,
          user: { select: { name: true }},
          _count: { select: { applicationGrants: true }},
        },
      },
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminApiKeysPage() {
  await ensureUserIsAdmin();
  const apiKeys = await getApiKeys();
  const ApiKeys = createDataTable(apiKeys, (apiKey) => apiKey.id);

  return (
    <PageLayout>
      <Headline id="users" actions={<ColumnSelection table={ApiKeys}/>}>API Keys ({apiKeys.length})</Headline>

      <ApiKeys.Table>
        <ApiKeys.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</ApiKeys.Column>
        <ApiKeys.Column id="name" title="Name" sortBy="name">{({ name }) => name}</ApiKeys.Column>
        <ApiKeys.Column id="token" title="Token" hidden>{({ token }) => <FlexRow><Code inline borderless>{token}</Code><CopyButton copy={token} icon="copy" iconOnly/></FlexRow>}</ApiKeys.Column>
        <ApiKeys.Column id="permissions" title="Permissions" hidden>{({ permissions }) => <PermissionCount permissions={permissions as Permission[]}/>}</ApiKeys.Column>
        <ApiKeys.Column id="error" title="Error Count" align="right" sortBy="errorCount">{({ errorCount }) => errorCount}</ApiKeys.Column>
        <ApiKeys.Column id="usedAt" title="Last used" sortBy="usedAt">{({ usedAt }) => usedAt === null ? '-' : <FormatDate date={usedAt}/>}</ApiKeys.Column>
        <ApiKeys.Column id="accountId" title="Account Id" hidden>{({ accountId }) => <Code inline borderless>{accountId}</Code>}</ApiKeys.Column>
        <ApiKeys.Column id="account" title="Account Name" sortBy={({ account }) => account.accountName}>{({ account }) => account.accountName}</ApiKeys.Column>
        <ApiKeys.Column id="accountDisplay" title="Account Display Name" sortBy={({ account }) => account.displayName}>{({ account }) => account.displayName}</ApiKeys.Column>
        <ApiKeys.Column id="verified" title="Verified" sortBy={({ account }) => account.verified.toString()}>{({ account }) => <Icon icon={account.verified ? 'checkmark' : 'cancel'}/>}</ApiKeys.Column>
        <ApiKeys.Column id="owner" title="Owner" sortBy={({ account }) => account.user.name}>{({ account }) => <Link href={`/admin/users/${account.userId}`}><FlexRow><Icon icon="user"/>{account.user.name}</FlexRow></Link>}</ApiKeys.Column>
        <ApiKeys.Column id="auths" title="App Grants" sortBy={({ account }) => account._count.applicationGrants} align="right">{({ account }) => account._count.applicationGrants}</ApiKeys.Column>
        <ApiKeys.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</ApiKeys.Column>
      </ApiKeys.Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'API keys'
};
