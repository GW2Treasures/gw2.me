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
import { List } from '@gw2treasures/ui/components/Layout/List';

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

      <Headline id="why">Why gw2.me</Headline>

      <p>
        gw2.me provides secure way for users to manage access between multiple Guild Wars 2 accounts and applications.
      </p>

      <List>
        <li>User don&apos;t have to handle API keys for every application, instead they just have to <b>setup gw2.me once.</b></li>
        <li>gw2.me generates <b>secure subtokens</b> with the specific scopes requested by the application.</li>
        <li>gw2.me also handles all <b>errors</b> around invalid API keys, so applications always receive valid API keys.</li>
        <li>
          Instead of instructing the user how to generate API keys and which permissions are required,
          applications can instead just include a <b>Login with gw2.me</b> button.
        </li>
        <li>
          Users can review and <b>revoke access</b> to any application at any point, which is often not possible with API keys because
          users tend to reuse the same API key for multiple applications.
        </li>
      </List>


      <Headline id="support">Support</Headline>

      <p>
        If you have any questions or need help integrating gw2.me into your application, you can use the
        #gw2treasures channel on <ExternalLink href="https://discord.gg/gvx6ZSE">GW2 Development Community Discord server</ExternalLink>.
      </p>

      <p>
        If you find any bugs on gw2.me you can report them in
        the <ExternalLink href="https://github.com/GW2Treasures/gw2.me/issues">GitHub issue tracker</ExternalLink>.
      </p>

      <Headline id="contribute">Contribute</Headline>

      <p>
        You can contribute to the development of gw2.me in
        the <ExternalLink href="https://github.com/GW2Treasures/gw2.me">GW2Treasures/gw2.me</ExternalLink> repository on github.
      </p>

    </PageLayout>
  );
}

export const metadata = {
  title: 'Developer Documentation',
  description: 'Documentation for integrating gw2.me',
};
