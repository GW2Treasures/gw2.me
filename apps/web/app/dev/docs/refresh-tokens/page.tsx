import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import Link from 'next/link';

export default function DevDocsRefreshTokensPage() {
  return (
    <PageLayout>
      <PageTitle>Refreshing Access Tokens</PageTitle>
      <p>
        Access tokens will expire after some time.
        When you get a token, the <Code inline>expires_in</Code> field indicates how long, in seconds,
        the token is valid for. When a token expires, it becomes invalid.
        If you call a API endpoint with an invalid token, the request returns 401 Unauthorized.
      </p>

      <p>
        Only confidential applications can refresh an expired access token using the
        <Code inline>refresh_token</Code> you received along with your access token.
        Public applications will need to request consent again with the flow described
        in <Link href="/dev/docs/access-tokens">Access Tokens</Link>.
      </p>

      <p>
        You should not proactively get a new access token when the old token expires,
        because you might not need the access token in the near future. Instead you should only
        get a fresh token when you need it and the access token is invalid.
        Access tokens can also become invalid for other reasons, before the expiration is reached,
        so it is a good practice to handle the 401 Unauthorized response and get a new token only when required.
      </p>

      <p>
        To get a fresh access token, send a POST request to <Code inline>https://gw2.me/api/token</Code>
        with the following parameters.
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
            <td><Code inline>grant_type</Code></td>
            <td><Code inline borderless>&quot;refresh_token&quot;</Code></td>
            <td>Must be <Code inline>refresh_token</Code> to receive a fresh access token.</td>
          </tr>
          <tr>
            <td><Code inline>refresh_token</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>refresh_token</Code>.</td>
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

      <p>
        The response will contain a fresh access token and also a new refresh token.
      </p>

      <p>
        Each refresh token can only be used once.
        For this reason you should make sure that your application,
        when it is multi-threaded or using multiple workers or processes,
        only makes one single request to refresh the token. Using a refresh token
        multiple times could mean that the refresh token is compromised and might lead
        to gw2.me invalidating your authorization.
      </p>

      <p>
        If the request to refresh the access token fails, the refresh token might have become invalid.
        You then should use the normal <Link href="/dev/docs/access-tokens">OAuth flow</Link> again to
        get a new access and refresh token.
      </p>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Refreshing Access Tokens',
};
