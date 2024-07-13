import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { ApiRequest } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { ensureUserIsAdmin } from '../admin';

function getRequests() {
  return db.apiRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 250
  });
}

export default async function AdminRequestsPage() {
  await ensureUserIsAdmin();
  const requests = await getRequests();
  const Requests = createDataTable(requests, (request) => request.id);

  return (
    <PageLayout>
      <Headline id="requests" actions={<ColumnSelection table={Requests}/>}>Requests ({requests.length})</Headline>

      <Requests.Table>
        <Requests.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Requests.Column>
        <Requests.Column id="status" title="Status" sortBy="status">{({ status }) => status !== 200 ? <span style={{ color: 'var(--color-error)' }}>{status}</span> : status}</Requests.Column>
        <Requests.Column id="endpoint" title="Endpoint" sortBy="endpoint">{({ endpoint }) => endpoint}</Requests.Column>
        <Requests.Column id="queryParameters" title="Query Parameters" sortBy="queryParameters">{({ queryParameters }) => queryParameters}</Requests.Column>
        <Requests.Column id="apiKey" title="API Key" sortBy="apiKey">{({ apiKey }) => apiKey && <FlexRow><Code inline borderless>{apiKey}</Code><CopyButton copy={apiKey} icon="copy" iconOnly/></FlexRow>}</Requests.Column>
        <Requests.Column id="error" title="Error" sortBy="response" hidden>{({ response }) => <Code borderless>{response}</Code>}</Requests.Column>
        <Requests.Column id="responseTime" title="Time" sortBy="responseTimeMs" align="right">{({ responseTimeMs }) => Math.round(responseTimeMs).toLocaleString() + ' ms'}</Requests.Column>
        <Requests.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Requests.Column>
        <Requests.Column id="action" title="Actions" small>{(apiRequest) => <LinkButton external appearance="menu" href={getUrlFromApiRequest(apiRequest).toString()} iconOnly target="_blank"><Icon icon="chevron-right"/></LinkButton>}</Requests.Column>
      </Requests.Table>
    </PageLayout>
  );
}

function getUrlFromApiRequest(apiRequest: ApiRequest) {
  const url = new URL(apiRequest.endpoint, 'https://api.guildwars2.com');
  url.search = apiRequest.queryParameters;

  if(apiRequest.apiKey) {
    url.searchParams.set('access_token', apiRequest.apiKey);
  }

  return url;
}

export const metadata = {
  title: 'Requests'
};
