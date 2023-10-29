import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { Icon } from '@gw2treasures/ui';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Table } from '@gw2treasures/ui/components/Table/Table';

function getApps() {
  return db.application.findMany({
    include: {
      owner: { select: { name: true }},
      _count: { select: { authorizations: true }}
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminUserPage() {
  const apps = await getApps();

  return (
    <PageLayout>
      <Headline id="users">Apps ({apps.length})</Headline>
      <Table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Owner</th>
            <th>Authorizations</th>
            <th>Created at</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id}>
              <td><Code inline borderless>{app.id}</Code></td>
              <td><FlexRow><ApplicationImage fileId={app.imageId}/> {app.name}</FlexRow></td>
              <td><FlexRow><Icon icon="user"/>{app.owner.name}</FlexRow></td>
              <td>{app._count.authorizations}</td>
              <td><FormatDate date={app.createdAt}/></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </PageLayout>
  );
}
