import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { ApiEndpoint } from './endpoint';
import { Code } from '@/components/Layout/Code';

export default function DevDocsApiReferencePage() {
  return (
    <PageLayout>
      <PageTitle>API Reference</PageTitle>
      <Notice type="warning">The API Reference is currently work in progress</Notice>

      <Headline id="POST /api/token">Get access token</Headline>
      <ApiEndpoint method="POST" body={[
        { name: 'grant_type', type: '"authorization_code"', description: <>Should be <Code inline>authorization_code</Code> to exchange your authorization code for an access token.</> },
        { name: 'code', type: 'String', description: 'The authorization code received as callback from the authorization request.' },
        { name: 'client_id', type: 'String', description: 'The client_id of your application.' },
        { name: 'client_secret', type: 'String', optional: true, description: 'The client_secret of your application. Only required for your confidential applications.' },
        { name: 'redirect_uri', type: 'String', description: 'This must be the same redirect_uri as used in the authorization request.' },
        { name: 'code_verifier', type: 'String', description: 'PKCE challenge verifier used to calculate code_challenge.' },
      ]}/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'API Reference',
};
