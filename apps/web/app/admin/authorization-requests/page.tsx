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
import { FC } from 'react';
import { AuthorizationRequestData } from 'app/(authorize)/authorize/types';
import { isTruthy } from '@gw2treasures/helper/is';

function getAuthorizationRequests() {
  return db.authorizationRequest.findMany({
    include: { client: { include: { application: { select: { imageId: true, name: true }}}}},
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
        <AuthorizationRequests.Column id="features" title="Features">{({ data }) => <Features data={(data as unknown as AuthorizationRequestData)}/>}</AuthorizationRequests.Column>
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

interface StateProps {
  state: AuthorizationRequestState | 'Expired'
}

const State: FC<StateProps> = ({ state }) => {
  return (
    <FlexRow>
      <span style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: state === 'Expired' || state === 'Canceled' ? '#f44336' : state === 'Authorized' ? '#4caf50' : '#03a9f4', opacity: .8 }}/>
      {state}
    </FlexRow>
  );
};


interface FeaturesProps {
  data: AuthorizationRequestData
}

const Features: FC<FeaturesProps> = ({ data }) => {
  const features = [
    data.code_challenge_method && 'PKCE',
    data.include_granted_scopes && 'Include Granted Scopes',
    data.prompt && `Prompt: ${data.prompt}`,
    !data.state && 'No State',
    data.verified_accounts_only && 'Verified Accounts',
  ].filter(isTruthy).join(', ');

  return (
    features
  );
};
