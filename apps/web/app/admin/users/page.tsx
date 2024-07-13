import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { Icon } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { ensureUserIsAdmin } from '../admin';

function getUsers() {
  return db.user.findMany({
    include: {
      _count: { select: { applications: true, authorizations: true, accounts: true }},
      sessions: { take: 1, orderBy: { lastUsed: 'desc' }, select: { lastUsed: true }},
    },
    orderBy: { createdAt: 'asc' }
  });
}

export default async function AdminUserPage() {
  await ensureUserIsAdmin();
  const users = await getUsers();
  const Users = createDataTable(users, (user) => user.id);

  return (
    <PageLayout>
      <Headline id="users" actions={<ColumnSelection table={Users}/>}>Users ({users.length})</Headline>

      <Users.Table>
        <Users.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Users.Column>
        <Users.Column id="name" title="Username" sortBy="name">{({ name }) => name}</Users.Column>
        <Users.Column id="email" title="Email" sortBy="email" hidden>{({ email }) => email}</Users.Column>
        <Users.Column id="roles" title="Roles" sortBy={({ roles }) => roles.length} hidden>{({ roles }) => roles.join(', ')}</Users.Column>
        <Users.Column id="apps" title="Apps" sortBy={({ _count }) => _count.applications} align="right">{({ _count }) => _count.applications}</Users.Column>
        <Users.Column id="auths" title="Authorizations" sortBy={({ _count }) => _count.authorizations} align="right">{({ _count }) => _count.authorizations}</Users.Column>
        <Users.Column id="accounts" title="Accounts" sortBy={({ _count }) => _count.accounts} align="right">{({ _count }) => _count.accounts}</Users.Column>
        <Users.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Users.Column>
        <Users.Column id="session" title="Last access" sortBy={({ sessions }) => sessions[0]?.lastUsed}>{({ sessions }) => sessions.length > 0 ? <FormatDate date={sessions[0].lastUsed}/> : '-'}</Users.Column>
        <Users.Column id="action" title="Actions" small>{({ id }) => <LinkButton appearance="menu" href={`/admin/users/${id}`} iconOnly><Icon icon="eye"/></LinkButton>}</Users.Column>
      </Users.Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Users'
};
