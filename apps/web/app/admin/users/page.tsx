import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { Icon } from '@gw2treasures/ui';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Table } from '@gw2treasures/ui/components/Table/Table';

function getUsers() {
  return db.user.findMany({
    include: {
      _count: { select: { applications: true, authorizations: true }}
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminUserPage() {
  const users = await getUsers();

  return (
    <PageLayout>
      <Headline id="users">Users ({users.length})</Headline>
      <Table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Apps</th>
            <th>Authorizations</th>
            <th>Created at</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td><Code inline borderless>{user.id}</Code></td>
              <td><FlexRow><Icon icon="user"/>{user.name}</FlexRow></td>
              <td>{user.email}</td>
              <td>{user.roles.join(', ')}</td>
              <td>{user._count.applications}</td>
              <td>{user._count.authorizations}</td>
              <td>{user.createdAt.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </PageLayout>
  );
}
