import { ApplicationImage } from '@/components/Application/ApplicationImage';
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

function getApps() {
  return db.application.findMany({
    include: {
      owner: { select: { name: true }},
      _count: { select: { authorizations: true }},
      authorizations: {
        take: 1,
        where: { usedAt: { not: null }},
        orderBy: { usedAt: 'desc' },
        select: { usedAt: true }
      },
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminAppsPage() {
  const apps = await getApps();
  const Apps = createDataTable(apps, (app) => app.id);

  return (
    <PageLayout>
      <Headline id="users" actions={<ColumnSelection table={Apps}/>}>Apps ({apps.length})</Headline>

      <Apps.Table>
        <Apps.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Apps.Column>
        <Apps.Column id="name" title="Name" sortBy="name">{({ name, imageId }) => <FlexRow><ApplicationImage fileId={imageId}/> {name}</FlexRow>}</Apps.Column>
        <Apps.Column id="public" title="Public URL" sortBy="publicUrl" hidden>{({ publicUrl }) => publicUrl}</Apps.Column>
        <Apps.Column id="owner" title="Owner" sortBy={({ owner }) => owner.name}>{({ owner, ownerId }) => <Link href={`/admin/users/${ownerId}`}><FlexRow><Icon icon="user"/>{owner.name}</FlexRow></Link>}</Apps.Column>
        <Apps.Column id="auths" title="Authorizations" sortBy={({ _count }) => _count.authorizations} align="right">{({ _count }) => _count.authorizations}</Apps.Column>
        <Apps.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Apps.Column>
        <Apps.Column id="session" title="Last used" sortBy={({ authorizations }) => authorizations[0]?.usedAt}>{({ authorizations }) => authorizations[0]?.usedAt ? <FormatDate date={authorizations[0].usedAt}/> : '-'}</Apps.Column>
      </Apps.Table>
    </PageLayout>
  );
}
