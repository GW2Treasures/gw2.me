import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { isTruthy } from '@gw2treasures/helper/is';
import { Icon } from '@gw2treasures/ui';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { List } from '@gw2treasures/ui/components/Layout/List';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { ensureUserIsAdmin } from 'app/admin/admin';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

const getClient = cache(function getClient(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      application: true,
      authorizations: {
        include: {
          user: true,
        }
      },
    }
  });
});

export default async function AdminUserDetailPage({ params }: PageProps<'/admin/clients/[id]'>) {
  await ensureUserIsAdmin();
  const { id } = await params;
  const client = await getClient(id);

  if(!client) {
    notFound();
  }

  const Authorizations = createDataTable(client.authorizations, ({ id }) => id);

  const now = new Date();

  return (
    <PageLayout>
      <PageTitle>{client.application.name} / {client.id}</PageTitle>

      {client.type}

      <Headline id="callbackUrls">Callback URLs</Headline>
      <List>
        {client.callbackUrls.map((url) => <li key={url}>{url}</li>)}
      </List>

      <Headline id="authorizations" actions={<ColumnSelection table={Authorizations}/>}>Authorizations ({client.authorizations.length})</Headline>
      <Authorizations.Table>
        <Authorizations.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Authorizations.Column>
        <Authorizations.Column id="type" title="Type" sortBy="type">{({ type }) => type}</Authorizations.Column>
        <Authorizations.Column id="flags" title="Flags">{({ codeChallenge, dpopJkt }) => [codeChallenge && 'PKCE', dpopJkt && 'DPoP'].filter(isTruthy).join(', ')}</Authorizations.Column>
        <Authorizations.Column id="user" title="User" sortBy="userId">{({ user }) => <Link href={`/admin/users/${user.id}`}><FlexRow><Icon icon="user"/>{user.name}</FlexRow></Link>}</Authorizations.Column>
        <Authorizations.Column id="scope" title="Scope" hidden>{({ scope }) => scope.join(' ')}</Authorizations.Column>
        <Authorizations.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Authorizations.Column>
        <Authorizations.Column id="expiresAt" title="Expires At" sortBy="expiresAt">{({ expiresAt }) => expiresAt ? (expiresAt < now ? <s><FormatDate date={expiresAt}/></s> : <FormatDate date={expiresAt}/>) : 'Never'}</Authorizations.Column>
        <Authorizations.Column id="usedAt" title="Used At" sortBy="usedAt">{({ usedAt }) => usedAt ? <FormatDate date={usedAt}/> : 'Never'}</Authorizations.Column>
      </Authorizations.Table>
    </PageLayout>
  );
}

export async function generateMetadata({ params }: PageProps<'/admin/clients/[id]'>): Promise<Metadata> {
  await ensureUserIsAdmin();
  const { id } = await params;
  const client = await getClient(id);

  return {
    title: `Application ${client?.application.name} / ${client?.id}`
  };
}
