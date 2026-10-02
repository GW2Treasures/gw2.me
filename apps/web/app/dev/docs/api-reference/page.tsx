import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { ApiEndpoint, ApiHeadline } from './endpoint';
import { Code } from '@/components/Layout/Code';
import { ApiReference } from './api-reference';
import { Highlight } from '@/components/Layout/Highlight';
import { TokenResponse } from '@gw2me/client';

const tokenResponse = {
  'access_token': 'xl1eSPfCpUNdQiIPe4TAag',
  'token_type': 'Bearer',
  'issued_token_type': 'urn:ietf:params:oauth:token-type:access_token',
  'expires_in': 604800,
  'refresh_token': 'mcn6FMwoiufzqcBDVwzOnz_NvGn-1ezzRKIm7vN_bsk',
  'scope': 'identify email gw2:account'
} satisfies TokenResponse;

const publicTokenResponse = {
  'access_token': 'xl1eSPfCpUNdQiIPe4TAag',
  'token_type': 'Bearer',
  'issued_token_type': 'urn:ietf:params:oauth:token-type:access_token',
  'expires_in': 604800,
  'scope': 'identify email gw2:account'
} satisfies TokenResponse;

export default function DevDocsApiReferencePage() {
  return (
    <PageLayout>
      <PageTitle>API Reference</PageTitle>
      <Notice type="warning">The API Reference is currently work in progress</Notice>

      <ApiReference>
        <ApiHeadline id="/api/token">Token Endpoint</ApiHeadline>
        <Headline id="access-token">Get access token</Headline>
        <ApiEndpoint method="POST" endpoint="/api/token" auth="oauth2" body={[
          { name: 'grant_type', type: '"authorization_code"', description: <>Should be <Code inline>authorization_code</Code> to exchange your authorization code for an access token.</> },
          { name: 'code', type: 'String', description: 'The authorization code received as callback from the authorization request.' },
          { name: 'redirect_uri', type: 'String', description: 'This must be the same redirect_uri as used in the authorization request.' },
          { name: 'code_verifier', type: 'String', optional: true, description: 'PKCE challenge verifier used to calculate code_challenge.' },
        ]} responses={[
          { id: 'confidential-success', type: 'Confidential', status: 200, title: 'Success', content: <Highlight code={JSON.stringify(tokenResponse, null, '  ')} language="json"/> },
          { id: 'public-success', type: 'Public', status: 200, title: 'Success', content: <Highlight code={JSON.stringify(publicTokenResponse, null, '  ')} language="json"/> },
        ]}/>

        <Headline id="refresh-token">Refresh token</Headline>
        <ApiEndpoint method="POST" endpoint="/api/token" auth="oauth2" body={[
          { name: 'grant_type', type: '"refresh_token"', description: <>Should be <Code inline>refresh_token</Code> to generate new a new access token using a refresh token.</> },
          { name: 'refresh_token', type: 'String', description: 'The refresh token.' },
        ]} responses={[
          { id: 'confidential-success', type: 'Confidential', status: 200, title: 'Success', content: <Highlight code={JSON.stringify(tokenResponse, null, '  ')} language="json"/> },
          { id: 'public-success', type: 'Public', status: 200, title: 'Success', content: <Highlight code={JSON.stringify(publicTokenResponse, null, '  ')} language="json"/> },
        ]}
        >
          <p>Not available for public clients.</p>
        </ApiEndpoint>
      </ApiReference>

    </PageLayout>
  );
}

export const metadata = {
  title: 'API Reference',
};
