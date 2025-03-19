import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { AuthorizationRequestState } from '@gw2me/database';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { ensureUserIsAdmin } from '../admin';
import { isExpired } from '@/lib/date';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { AuthorizationRequestData } from 'app/(authorize)/authorize/types';
import Link from 'next/link';
import { Icon } from '@gw2treasures/ui';
import { Features, State } from './components';

function getAuthorizationRequests() {
  return db.authorizationRequest.findMany({
    include: {
      client: { select: { application: { select: { imageId: true, name: true }}}},
      user: { select: { id: true, name: true }},
    },
    orderBy: { createdAt: 'desc' },
    take: 250
  });
}

export default async function AdminAuthorizationRequestsPage() {
  await ensureUserIsAdmin();
  const requests = await getAuthorizationRequests();
  const AuthorizationRequests = createDataTable(requests, (request) => request.id);

  return (
    <PageLayout>
      <Headline id="requests" actions={<ColumnSelection table={AuthorizationRequests}/>}>Authorization Requests ({requests.length})</Headline>

      <AuthorizationRequests.Table>
        <AuthorizationRequests.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="type" title="Type" sortBy="type">{({ type }) => type}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="state" title="Status" sortBy="state">{({ state, expiresAt }) => <State state={state === AuthorizationRequestState.Pending && isExpired(expiresAt) ? 'Expired' : state}/>}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="app" title="Application" sortBy="clientId">{({ client }) => <FlexRow><ApplicationImage fileId={client.application.imageId}/> {client.application.name}</FlexRow>}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="features" title="Features">{({ type, data }) => <Features type={type} data={(data as unknown as AuthorizationRequestData)}/>}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="user" title="User" sortBy={({ user }) => user?.name}>{({ user }) => user && (<Link href={`/admin/users/${user.id}`}><FlexRow><Icon icon="user"/>{user.name}</FlexRow></Link>)}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="updatedAt" title="Updated At" sortBy="updatedAt" hidden>{({ updatedAt }) => <FormatDate date={updatedAt}/>}</AuthorizationRequests.Column>
        <AuthorizationRequests.Column id="expiresAt" title="Expires At" sortBy="expiresAt" hidden>{({ expiresAt }) => expiresAt ? <FormatDate date={expiresAt}/> : 'never'}</AuthorizationRequests.Column>
      </AuthorizationRequests.Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Authorization Requests'
};
