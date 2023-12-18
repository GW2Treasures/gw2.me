import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { Icon } from '@gw2treasures/ui';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { Table } from '@gw2treasures/ui/components/Table/Table';

function getUsers() {
  return db.user.findMany({
    include: {
      _count: { select: { applications: true, authorizations: true }},
      sessions: { take: 1, orderBy: { lastUsed: 'desc' }, select: { lastUsed: true }},
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminUserPage() {
  const users = await getUsers();
  const Users = createDataTable(users, (user) => user.id);

  return (
    <PageLayout>
      <Headline id="users">Users ({users.length})</Headline>

      <Users.Table>
        <Users.Column id="id" title="Id">{({ id }) => <Code inline borderless>{id}</Code>}</Users.Column>
        <Users.Column id="name" title="Username" sortBy="name">{({ name }) => name}</Users.Column>
        <Users.Column id="email" title="Email" sortBy="email">{({ email }) => email}</Users.Column>
        <Users.Column id="roles" title="Roles" sortBy={({ roles }) => roles.length}>{({ roles }) => roles.join(', ')}</Users.Column>
        <Users.Column id="apps" title="Apps" sortBy={({ _count }) => _count.applications} align="right">{({ _count }) => _count.applications}</Users.Column>
        <Users.Column id="auths" title="Authorizations" sortBy={({ _count }) => _count.authorizations} align="right">{({ _count }) => _count.authorizations}</Users.Column>
        <Users.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Users.Column>
        <Users.Column id="session" title="Last access" sortBy={({ sessions }) => sessions[0]?.lastUsed}>{({ sessions }) => sessions.length > 0 ? <FormatDate date={sessions[0].lastUsed}/> : '-'}</Users.Column>
      </Users.Table>
    </PageLayout>
  );
}
