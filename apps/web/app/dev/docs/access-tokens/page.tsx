import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { List } from '@gw2treasures/ui/components/Layout/List';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import Link from 'next/link';

export default function DevDocsAccessTokensPage() {
  return (
    <PageLayout>
      <PageTitle>Getting OAuth Access Tokens</PageTitle>
      <p>To access gw2.me APIs to get info about the user or generate subtokens to access the Guild Wars 2 API you will need an access token. To get an access token the user needs to authorize your application first.</p>

      <Headline id="user-authorization">User Authorization</Headline>
      <p>
        The first step is to get the user to authorize your application&apos;s access.
        Navigate the user to <Code inline>https://gw2.me/oauth2/authorize</Code>.
        If your application is a website, you can for example use a hyperlink or a redirect.
        Native and mobile applications should open the default browser.
        Don&apos;t use iframes or embedded browsers.
      </p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Parameter</Table.HeaderCell>
            <Table.HeaderCell small>Type</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code inline>response_type</Code></td>
            <td><Code inline borderless>&quot;code&quot;</Code></td>
            <td>Must be <Code inline>code</Code> for authorization code grant. Other grants are not supported at the moment.</td>
          </tr>
          <tr>
            <td><Code inline>redirect_uri</Code></td>
            <td><Code inline borderless>URL</Code></td>
            <td>The URL the user will be redirected back to after authorization. Must be an exact URL configured in your application settings.</td>
          </tr>
          <tr>
            <td><Code inline>client_id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_id</Code> of your application.</td>
          </tr>
          <tr>
            <td><Code inline>scope</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>List of <Link href="/dev/docs/scopes">scopes</Link> separated by spaces.</td>
          </tr>
          <tr>
            <td><Code inline>include_granted_scopes</Code> (optional)</td>
            <td><Code inline borderless>&quot;true&quot;</Code></td>
            <td>If this parameter is <Code inline>true</Code>, all previously authorized scopes will be included. This can be used for incremental authorization.</td>
          </tr>
          <tr>
            <td><Code inline>prompt</Code> (optional)</td>
            <td><Code inline borderless>&quot;none&quot; | &quot;consent&quot;</Code></td>
            <td>
              <List>
                <li><Code inline>none</Code> - no consent screen will be shown. If the user is not already authenticated this will return an error.</li>
                <li><Code inline>consent</Code> - always display a consent screen.</li>
                <li>If no value is specified and the user has not previously authorized access, the user will be shown a consent screen. Subsequent requests will not show the consent screen.</li>
              </List>
            </td>
          </tr>
          <tr>
            <td><Code inline>state</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>Recommended string to improve security by preventing Cross-Site Request Forgery (CSRF) attacks. If the state returned to your redirect url does not match the state you provided in the request, the response should be ignored. The state string should be randomly generated and unique for each OAuth request.</td>
          </tr>
          <tr>
            <td><Code inline>code_challenge</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>PKCE challenge. Required for public applications.</td>
          </tr>
          <tr>
            <td><Code inline>code_challenge_method</Code> (optional)</td>
            <td><Code inline borderless>&quot;S256&quot;</Code></td>
            <td>PKCE challenge method. Only SHA-256 is supported.</td>
          </tr>
        </tbody>
      </Table>

      <p>An example request could look like this (URL formatted for better readability)</p>

      <Code>
        https://gw2.me/oauth2/authorize<br/>  ?client_id=1554a6a3-8b8e-4ba7-9c5f-80576d081e10<br/>  &response_type=code<br/>  &redirect_uri=http%3A%2F%2Fexample.com%2Fcallback<br/>  &scope=identify+email+gw2%3Aaccount<br/>  &state=SaOfpb7Ny9mbV6EPCUDcnQ<br/>  &code_challenge=oFtTjTxdlTh9Tdwe8Rpbly8Qy8AL5rfKc9aueH_PmZM<br/>  &code_challenge_method=S256
      </Code>


      <p>If the user is not logged in to gw2.me yet, they get asked to login first. The user is then presented with a authorization page that shows your applications name, icon and all required scopes. If you requested any scopes for the Guild Wars 2 API, the user has to select at least one Guild Wars 2 account. The user can also add additional accounts on this screen.</p>
      <p>After the user authorized your application, the user is redirected to the specified <Code inline>redirect_uri</Code>.</p>

      <p>If the authorization was successful, the url will contain the query parameter <Code inline>code</Code> with an authorization code that needs to be exchanged for an access token in the next step.</p>
      <Code>https://example.com/callback<br/>  ?state=ocbBQyUo1G6551bD5sNMdA<br/>  &<strong>code=ciA-F7NVbINw1dcEVeYdww</strong></Code>

      <p>If the authoriztion was not successful, the url will contain the <Code inline>error</Code> and <Code inline>error_description</Code> query parameters detailing the reason.</p>
      <Code>https://example.com/callback<br/>  ?state=yuUK87DIP1NSCfL8XdHM2A<br/>  &<strong>error=access_denied</strong><br/>  &<strong>error_description=user+canceled+authorization</strong></Code>


      <Headline id="access-token">Access Token</Headline>

      <p>Next you will have to exchange the authorization code obtained in the first step for an access token (and refresh token).</p>

      <p>You will have to make a POST request to <Code inline>https://gw2.me/api/token</Code> with the following parameters.</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Parameter</Table.HeaderCell>
            <Table.HeaderCell small>Type</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code inline>grant_type</Code></td>
            <td><Code inline borderless>&quot;authorization_code&quot;</Code></td>
            <td>Should be <Code inline>authorization_code</Code> to exchange your authorization code for an access token.</td>
          </tr>
          <tr>
            <td><Code inline>code</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The authorization code received as callback from the authorization request.</td>
          </tr>
          <tr>
            <td><Code inline>client_id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_id</Code> of your application.</td>
          </tr>
          <tr>
            <td><Code inline>client_secret</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_secret</Code> of your application. Only required for your confidential applications.</td>
          </tr>
          <tr>
            <td><Code inline>redirect_uri</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>This must be the same <Code inline>redirect_uri</Code> as used in the authorization request.</td>
          </tr>
          <tr>
            <td><Code inline>challenge_verifier</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>PKCE challenge verifier used to calculate <Code inline>code_challenge</Code>.</td>
          </tr>
        </tbody>
      </Table>

      <p>If the request is successful, the response will contain the access token used to access any further apis.</p>

      <Code>
        {JSON.stringify({
          'access_token': 'xl1eSPfCpUNdQiIPe4TAag',
          'token_type': 'Bearer',
          'expires_in': 604800,
          'refresh_token': 'mcn6FMwoiufzqcBDVwzOnz_NvGn-1ezzRKIm7vN_bsk',
          'scope': 'identify email gw2:account'
        }, null, 2)}
      </Code>


      <Headline id="next-steps">Next Steps</Headline>
      <List numbered>
        <li><Link href="/dev/docs/refresh-tokens">Refresh Tokens</Link> when they expire.</li>
        <li><Link href="/dev/docs/gw2-api">Generate a Guild Wars 2 Subtoken</Link> to access the Guild Wars 2 API.</li>
        <li>Check the <Link href="/dev/docs/api-reference">API Reference</Link> for a list of all available APIs.</li>
      </List>


      <Headline id="incremental-authorization">Incremental Authorization</Headline>
      <p>TODO: Describe incremental auth</p>

      <Headline id="pkce">Proof Key for Code Exchange (PKCE)</Headline>
      <p>TODO: Describe PKCE</p>


    </PageLayout>
  );
}

export const metadata = {
  title: 'Getting OAuth Access Tokens',
};
