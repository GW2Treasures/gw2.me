import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Steps } from '@/components/Steps/Steps';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import Link from 'next/link';
import { PageTitle } from '@/components/Layout/PageTitle';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';

export default function Docs() {
  return (
    <PageLayout>
      <PageTitle>Documentation</PageTitle>

      <p>gw2.me uses <ExternalLink href="https://datatracker.ietf.org/doc/html/rfc6749">OAuth 2.0</ExternalLink> to manage the access between users and applications.</p>

      <Headline id="use">Use gw2.me in your application</Headline>

      <Steps>
        <div><Link href="/dev/docs/register-app">Register your application</Link>.</div>
        <div><Link href="/dev/docs/access-token">Get an access token</Link> by navigating the user to the authorization page.</div>
        <div>
          Access the Guild Wars 2 API by <Link href="/dev/docs/gw2-api">generating subtokens</Link> or
          use other <Link href="/dev/docs/api-reference">gw2.me APIs</Link>.
        </div>
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
    </PageLayout>
  );
}

export const metadata = {
  title: 'Developer Documentation',
  description: 'Documentation for integrating gw2.me',
};
