import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import styles from '../layout.module.css';

export default function DevDocsScopePage() {
  return (
    <PageLayout className={styles.layout}>
      <PageTitle>Scopes</PageTitle>
      <p>gw2.me API endpoints each require specific permissions. When you authorizing a user, you will need to provide a list of scopes that is required by your application.</p>

      <p>This is a list of all supported scopes. Scopes with the prefix <Code inline>gw2:</Code> are Guild Wars 2 API permissions that are set on generated subtokens.</p>

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
            <td><Code inline>accounts</Code></td>
            <td>Get the list of accounts from /api/accounts. This scope is always implied when any <Code inline>gw2:*</Code> scope is included.</td>
          </tr>
          <tr>
            <td><Code inline>accounts.displayName</Code></td>
            <td>Include the user-defined displa name in the account list</td>
          </tr>
          <tr>
            <td><Code inline>accounts.verified</Code></td>
            <td>Include the account verification status.</td>
          </tr>

          <tr>
            <td><Code inline>gw2:account</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>account</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:inventories</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>inventories</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:characters</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>characters</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:tradingpost</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>tradingpost</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:wallet</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>wallet</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:unlocks</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>unlocks</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:pvp</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>pvp</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:builds</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>builds</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:progression</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>progression</Code> permission</td>
          </tr>
          <tr>
            <td><Code inline>gw2:guilds</Code></td>
            <td>Guild Wars 2 API subtokens will include the <Code inline>guilds</Code> permission</td>
          </tr>
        </tbody>
      </Table>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Scopes',
};
