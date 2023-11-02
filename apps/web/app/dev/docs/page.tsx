import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Steps } from '@/components/Steps/Steps';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import Link from 'next/link';
import { PageTitle } from '@/components/Layout/PageTitle';

export default function Docs() {
  return (
    <PageLayout>
      <PageTitle>Documentation</PageTitle>

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
    </PageLayout>
  );
}
export interface AccountsResponse {
  accounts: {
    id: string;
    name: string;
  }[]
}

export const metadata = {
  title: 'Developer Documentation',
  description: 'Documentation for integrating gw2.me',
};
