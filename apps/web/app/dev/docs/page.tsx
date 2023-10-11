import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Steps } from '@/components/Steps/Steps';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { List } from '@gw2treasures/ui/components/Layout/List';
import Link from 'next/link';

export default function Docs() {
  return (
    <PageLayout>
      <Headline id="docs">Documentation</Headline>

      <p>gw2.me is a OAuth2 server. This page documents the basic concept, supported scopes and the available endpoints with requests parameters and response bodies.</p>

      <Headline id="overview">Overview</Headline>

      <p>This is a abstract overview of the OAuth2 flow.</p>

      <Steps>
        <div><Link href="/dev/applications/create">Register your application</Link>.</div>
        <div>Configure your <Code inline>client_id</Code> and <Code inline>client_secret</Code> in your application.</div>
        <div>Redirect the user to the authorization URL.</div>
        <div>The user authorizes your application and gets redirected back to you with a <Code inline>code</Code>.</div>
        <div>Exchange your <Code inline>code</Code> for a <Code inline>refresh_token</Code> and <Code inline>access_token</Code>.</div>
        <div>Use your <Code inline>access_token</Code> to access the gw2.me API and create Guild Wars 2 API Subtokens.</div>
        <div>The <Code inline>refresh_token</Code> can generate a new <Code inline>access_token</Code> when it expires.</div>
      </Steps>

      <p>Most of these steps can be handled by using existing OAuth2 libraries.</p>

      <Headline id="urls">OAuth2 URLs</Headline>
      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Endpoint</Table.HeaderCell>
            <Table.HeaderCell>URL</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Base authorization URL</td>
            <td><FlexRow><Code inline>https://gw2.me/oauth2/authorize</Code><CopyButton copy="https://gw2.me/oauth2/authorize" icon="copy" iconOnly/></FlexRow></td>
          </tr>
          <tr>
            <td>Token URL</td>
            <td><FlexRow><Code inline>https://gw2.me/api/token</Code><CopyButton copy="https://gw2.me/api/token" icon="copy" iconOnly/></FlexRow></td>
          </tr>
        </tbody>
      </Table>

      <Headline id="scopes">Scopes</Headline>
      <p>This is a list of all supported scopes. Permissions for the Guild Wars 2 API are prefixed with <Code inline>gw2:</Code>.</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Scope</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code inline>identify</Code></td>
            <td>Get the username from /api/user</td>
          </tr>
          <tr>
            <td><Code inline>email</Code></td>
            <td>Include the email in /api/user</td>
          </tr>

          <tr>
            <td><Code inline>gw2:account</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>account</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:inventories</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>inventories</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:characters</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>characters</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:tradingpost</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>tradingpost</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:wallet</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>wallet</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:unlocks</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>unlocks</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:pvp</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>pvp</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:builds</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>builds</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:progression</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>progression</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:guilds</Code></td>
            <td>GW2 API Subtokens will include the <Code inline>guilds</Code> permission</td>
          </tr>
        </tbody>
      </Table>

      <Headline id="authorization">Authorization</Headline>

      <p>
        Redirect the user to <Code inline>https://gw2.me/oauth2/authorize</Code> to authorize your application.
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
            <td>List of <Link href="#scopes">scopes</Link> separated by spaces.</td>
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
                <li><Code inline>none</Code><br/>gw2.me will not display a consent screen. If the user is not already authenticated this will return an error.</li>
                <li><Code inline>consent</Code><br/>gw2.me will always display a consent screen.</li>
                <li>If no value is specified and the user has not previously authorized access, then the user is shown a consent screen.</li>
              </List>
            </td>
          </tr>
          <tr>
            <td><Code inline>state</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>Recommended state to improve security.</td>
          </tr>
          <tr>
            <td><Code inline>code_challenge</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>PKCE challenge. Required for <Code inline>Public</Code> applications.</td>
          </tr>
          <tr>
            <td><Code inline>code_challenge_method</Code> (optional)</td>
            <td><Code inline borderless>&quot;S256&quot;</Code></td>
            <td>PKCE challenge method. Only SHA-256 is supported.</td>
          </tr>
        </tbody>
      </Table>

      <p>After authorization the user will be redirected to the <Code inline>redirect_uri</Code> with the additional query parameters <Code inline>code</Code> and <Code inline>state</Code>.</p>

      <Headline id="access-token">Get access token</Headline>

      <p>Make a POST request to <Code inline>https://gw2.me/api/token</Code> to exchange your <Code inline>code</Code> with an <Code inline>access_token</Code> and <Code inline>refresh_token</Code>. The body needs to have the <Code inline>Content-Type: application/x-www-form-urlencoded</Code>.</p>

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
            <td>Must be <Code inline>authorization_code</Code> to exchange your <Code inline>code</Code> with an <Code inline>access_token</Code> and <Code inline>refresh_token</Code>.</td>
          </tr>
          <tr>
            <td><Code inline>code</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>code</Code> you received from the authorization callback.</td>
          </tr>
          <tr>
            <td><Code inline>client_id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_id</Code> of your application.</td>
          </tr>
          <tr>
            <td><Code inline>client_secret</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_secret</Code> of your application. Only required if your app is <Code inline>Confidential</Code>.</td>
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

      <p>The response is will be a JSON object with the following properties:</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Property</Table.HeaderCell>
            <Table.HeaderCell small>Type</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code inline>access_token</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The generated <Code inline>access_token</Code>. The <Code inline>access_token</Code> is used to make requests to the gw2.me API.</td>
          </tr>
          <tr>
            <td><Code inline>token_type</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The type of the <Code inline>access_token</Code>. Always <Code inline>Bearer</Code>.</td>
          </tr>
          <tr>
            <td><Code inline>expires_in</Code></td>
            <td><Code inline borderless>Number</Code></td>
            <td>Seconds until the access_token expires and needs to be refreshed.</td>
          </tr>
          <tr>
            <td><Code inline>refresh_token</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The generated <Code inline>refresh_token</Code>. The <Code inline>refresh_token</Code> can be used to <Link href="#refresh-token">generate a fresh <Code inline>access_token</Code></Link>. Only included if the application is <Code inline>Confidential</Code></td>
          </tr>
          <tr>
            <td><Code inline>scope</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Link href="#scopes">scopes</Link> authorized for this <Code inline>access_token</Code> separated by spaces.</td>
          </tr>
        </tbody>
      </Table>

      <Headline id="refresh-token">Refresh token</Headline>

      <p>When the <Code inline>access_token</Code> expires <Code inline>Confidential</Code> apps can refreshed it by making a POST request to <Code inline>https://gw2.me/api/token</Code>. The body needs to have the <Code inline>Content-Type: application/x-www-form-urlencoded</Code>.</p>

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
            <td><Code inline borderless>&quot;refresh_token&quot;</Code></td>
            <td>Must be <Code inline>authorization_code</Code> to exchange your <Code inline>code</Code> with an <Code inline>access_token</Code> and <Code inline>refresh_token</Code>.</td>
          </tr>
          <tr>
            <td><Code inline>refresh_token</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>refresh_token</Code> you received from the <Link href="#access-token"><Code inline>access_token</Code>-request</Link>.</td>
          </tr>
          <tr>
            <td><Code inline>client_id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_id</Code> of your application.</td>
          </tr>
          <tr>
            <td><Code inline>client_secret</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_secret</Code> of your application.</td>
          </tr>
        </tbody>
      </Table>

      <p>The response is the same as when <Link href="#access-token">generating the <Code inline>access_token</Code></Link> the first time.</p>

      <Headline id="identify">Get the users identity</Headline>

      <p>After the user has authorized your application you can request the users identity by making a request to <Code inline>https://gw2.me/api/user</Code>. You will need to pass your <Code inline>access_token</Code> as a header (<Code inline>Authorization: Bearer &lt;access_token&gt;</Code>). Requires the <Code inline>identify</Code> scope. The response is a JSON object with the following properties.</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Property</Table.HeaderCell>
            <Table.HeaderCell small>Type</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code inline>user</Code></td>
            <td><Code inline borderless>Object</Code></td>
            <td>The user object.</td>
          </tr>
          <tr>
            <td><Code inline>user.id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The id of the user.</td>
          </tr>
          <tr>
            <td><Code inline>user.name</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The name of the user.</td>
          </tr>
          <tr>
            <td><Code inline>user.email</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The email of the user. Only included if the <Code inline>access_token</Code> includes the scope <Code inline>email</Code>.</td>
          </tr>
        </tbody>
      </Table>

      <Headline id="accounts">Get Guild Wars 2 Accounts</Headline>

      <p>After the user has authorized your application you can request the shared Guild Wars 2 Accounts by making a request to <Code inline>https://gw2.me/api/accounts</Code>. You will need to pass your <Code inline>access_token</Code> as a header (<Code inline>Authorization: Bearer &lt;access_token&gt;</Code>). This requires at least one Guild Wars 2 scope.</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Property</Table.HeaderCell>
            <Table.HeaderCell small>Type</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code inline>accounts</Code></td>
            <td><Code inline borderless>Array</Code></td>
            <td>List of the Guild Wars 2 accounts of the user.</td>
          </tr>
          <tr>
            <td><Code inline>accounts[].id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The unique id of the account. This is the same id as returned from the <Code inline borderless>/v2/accounts</Code> Guild Wars 2 API endpoint.</td>
          </tr>
          <tr>
            <td><Code inline>accounts[].name</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The name of the account as returned by the <Code inline borderless>/v2/accounts</Code> Guild Wars 2 API endpoint.</td>
          </tr>
        </tbody>
      </Table>

      <Headline id="subtokens">Creating GW2 API Subtokens</Headline>

      <p>To access the Guild Wars 2 API you can create a subtoken by requesting <Code inline>https://gw2.me/api/accounts/&lt;accountId&gt;/subtoken</Code>. You will need to pass your <Code inline>access_token</Code> as a header (<Code inline>Authorization: Bearer &lt;access_token&gt;</Code>). This requires at least one Guild Wars 2 scope.</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Property</Table.HeaderCell>
            <Table.HeaderCell small>Type</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code inline>subtoken</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>A Subtoken that can be used to make authenticated requests to the Guild Wars 2 API.</td>
          </tr>
          <tr>
            <td><Code inline>expiresAt</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The timestamp when the subtoken expires as ISO-8601 string.</td>
          </tr>
        </tbody>
      </Table>
    </PageLayout>
  );
}
export interface AccountsResponse {
  accounts: {
    id: string;
    name: string;
  }[]
}
