import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

const getApplications = cache(async () => {
  const session = await getSessionOrRedirect();

  return db.application.findMany({
    where: { ownerId: session.userId },
    select: {
      id: true,
      name: true,
      imageId: true,
      authorizations: {
        select: { id: true },
        where: { OR: [{ expiresAt: { gte: new Date() }}, { expiresAt: null }], type: { in: ['AccessToken', 'RefreshToken'] }},
        distinct: 'userId'
      },
    },
    orderBy: { createdAt: 'asc' },
  });
});

export default async function DevPage() {
  const applications = await getApplications();
  const Applications = createDataTable(applications, ({ id }) => id);

  return (
    <PageLayout>
      <Headline id="applications" actions={<LinkButton href="/dev/applications/create" icon="add">Create</LinkButton>}>Your Applications</Headline>

      <Applications.Table>
        <Applications.Column id="app" title="Application" sortBy="name">{({ name, imageId }) => (<FlexRow><ApplicationImage fileId={imageId}/>{name}</FlexRow>)}</Applications.Column>
        <Applications.Column id="users" title="Users" sortBy={({ authorizations }) => authorizations.length}>{({ authorizations }) => authorizations.length}</Applications.Column>
        <Applications.Column id="actions" title="Actions" small>{({ id }) => (<LinkButton href={`/dev/applications/${id}`} icon="settings">Manage</LinkButton>)}</Applications.Column>
      </Applications.Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Your Applications'
};
