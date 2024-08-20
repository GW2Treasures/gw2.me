import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import styles from '../layout.module.css';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';

export default function DevDocsScopePage() {
  return (
    <PageLayout className={styles.layout}>
      <PageTitle>Client Libraries</PageTitle>
      <p>gw2.me provides the following client libraries to use instead of manually making all the requests. For the authentication flow, existing OAuth 2.0 libraries will also work, though they don&apos;t provide the gw2.me specific requests like getting the accounts or creating a Guild Wars 2 API subtoken.</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell small>Language</Table.HeaderCell>
            <Table.HeaderCell>Library</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>JavaScript/TypeScript</th>
            <td><ExternalLink href="https://www.npmjs.com/package/@gw2me/client">@gw2me/client</ExternalLink></td>
            <td>Fully typed JavaScript library for Node.js and browsers to access all gw2.me APIs and to create authorization URLs.</td>
          </tr>
        </tbody>
      </Table>

      <Headline id="third-party">Third-party Libraries</Headline>

      <p>If you made your own client library to access gw2.me, please create a Pull Request or Issue in the <ExternalLink href="https://github.com/GW2Treasures/gw2.me">GitHub repository</ExternalLink> to have it included on this page.</p>

    </PageLayout>
  );
}

export const metadata = {
  title: 'Client Libraries',
};
