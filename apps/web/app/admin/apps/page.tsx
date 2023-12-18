import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { Icon } from '@gw2treasures/ui';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { Table } from '@gw2treasures/ui/components/Table/Table';

function getApps() {
  return db.application.findMany({
    include: {
      owner: { select: { name: true }},
      _count: { select: { authorizations: true }},
      authorizations: { take: 1, orderBy: { usedAt: 'desc' }, select: { usedAt: true }},
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminUserPage() {
  const apps = await getApps();
  const Apps = createDataTable(apps, (app) => app.id);

  return (
    <PageLayout>
      <Headline id="users">Apps ({apps.length})</Headline>

      <Apps.Table>
        <Apps.Column id="id" title="Id">{({ id }) => <Code inline borderless>{id}</Code>}</Apps.Column>
        <Apps.Column id="name" title="Name" sortBy="name">{({ name, imageId }) => <FlexRow><ApplicationImage fileId={imageId}/> {name}</FlexRow>}</Apps.Column>
        <Apps.Column id="owner" title="Owner" sortBy={({ owner }) => owner.name}>{({ owner }) => <FlexRow><Icon icon="user"/>{owner.name}</FlexRow>}</Apps.Column>
        <Apps.Column id="auths" title="Authorizations" sortBy={({ _count }) => _count.authorizations} align="right">{({ _count }) => _count.authorizations}</Apps.Column>
        <Apps.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Apps.Column>
        <Apps.Column id="session" title="Last used" sortBy={({ authorizations }) => authorizations[0]?.usedAt}>{({ authorizations }) => authorizations[0]?.usedAt ? <FormatDate date={authorizations[0].usedAt}/> : '-'}</Apps.Column>
      </Apps.Table>
    </PageLayout>
  );
}
