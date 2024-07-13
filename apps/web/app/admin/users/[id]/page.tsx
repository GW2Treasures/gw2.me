import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { ensureUserIsAdmin } from 'app/admin/admin';
import { notFound } from 'next/navigation';

function getUser(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      authorizations: { include: { application: { select: { name: true, imageId: true }}}},
      accounts: true,
      providers: true,
    }
  });
}

export default async function AdminUserDetailPage({ params }: { params: { id: string }}) {
  await ensureUserIsAdmin();
  const user = await getUser(params.id);

  if(!user) {
    notFound();
  }

  const Authorizations = createDataTable(user.authorizations, ({ id }) => id);
  const Accounts = createDataTable(user.accounts, ({ id }) => id);
  const Providers = createDataTable(user.providers, ({ provider, providerAccountId }) => `${provider}:${providerAccountId}`);

  return (
    <PageLayout>
      <PageTitle>{user.name}</PageTitle>

      <Headline id="authorizations" actions={<ColumnSelection table={Authorizations}/>}>Authorizations ({user.authorizations.length})</Headline>
      <Authorizations.Table>
        <Authorizations.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Authorizations.Column>
        <Authorizations.Column id="app" title="App">{({ application }) => <FlexRow><ApplicationImage fileId={application.imageId}/> {application.name}</FlexRow>}</Authorizations.Column>
        <Authorizations.Column id="type" title="Type" sortBy="type">{({ type }) => type}</Authorizations.Column>
        <Authorizations.Column id="scope" title="Scope" hidden>{({ scope }) => scope.join(' ')}</Authorizations.Column>
        <Authorizations.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Authorizations.Column>
        <Authorizations.Column id="expiresAt" title="Expires At" sortBy="expiresAt">{({ expiresAt }) => expiresAt ? <FormatDate date={expiresAt}/> : 'Never'}</Authorizations.Column>
        <Authorizations.Column id="usedAt" title="Used At" sortBy="usedAt">{({ usedAt }) => usedAt ? <FormatDate date={usedAt}/> : 'Never'}</Authorizations.Column>
      </Authorizations.Table>

      <Headline id="accounts" actions={<ColumnSelection table={Accounts}/>}>Accounts ({user.accounts.length})</Headline>
      <Accounts.Table>
        <Accounts.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Accounts.Column>
        <Accounts.Column id="accountId" title="Account Id" hidden>{({ accountId }) => <Code inline borderless>{accountId}</Code>}</Accounts.Column>
        <Accounts.Column id="name" title="Name">{({ accountName }) => accountName}</Accounts.Column>
        <Accounts.Column id="display" title="Display Name">{({ displayName }) => displayName}</Accounts.Column>
        <Accounts.Column id="verified" title="Verified">{({ verified }) => verified ? 'Yes' : 'No'}</Accounts.Column>
        <Accounts.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Accounts.Column>
      </Accounts.Table>

      <Headline id="providers" actions={<ColumnSelection table={Providers}/>}>Providers ({user.providers.length})</Headline>
      <Providers.Table>
        <Providers.Column id="provider" title="Provider">{({ provider }) => provider}</Providers.Column>
        <Providers.Column id="providerId" title="Provider Id">{({ providerAccountId }) => <Code inline borderless>{providerAccountId}</Code>}</Providers.Column>
        <Providers.Column id="name" title="Name">{({ displayName }) => displayName}</Providers.Column>
        <Providers.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Providers.Column>
      </Providers.Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'User'
};
