import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import Link from 'next/link';

export default function DevDocsGW2APIPage() {
  return (
    <PageLayout>
      <PageTitle>Access the Guild Wars 2 API</PageTitle>
      <p>
        The Guild Wars 2 API supports JWT tokens, called subtokens by the API,
        in addition to the usual API key to authorize requests. You can request a subtoken
        from the gw2.me API so you can make authorized requests to the Guild Wars 2 API yourself.
      </p>

      <p>
        Subtokens generated by gw2.me are only valid for a short time (usually 10 minutes).
        This is because subtokens can not be invalidated and should stop working shortly after
        the user removes the authorization for your app.
      </p>


      <Headline id="accounts">Get Accounts</Headline>

      <p>
        Before you can request a subtoken, you will need to get the list of accounts
        the user has shared with your application. Make a request to <Code inline>https://gw2.me/api/accounts</Code>.
        You will need to pass your <Code inline>access_token</Code> as a header (<Code inline>Authorization: Bearer &lt;access_token&gt;</Code>).
        This requires at least one <Link href="/dev/docs/scope">Guild Wars 2 scope</Link>.
      </p>

      <p>
        The response will be a JSON object with the list of accounts with the account id and name
        as returned by the <Code inline borderless>/v2/accounts</Code> Guild Wars 2 API endpoint.
      </p>

      <Code>
        {JSON.stringify({
          accounts: [{ id: 'C2BFF77D-B669-E111-809D-78E7D1936EF0', name: 'darthmaim.6017' }]
        }, null, 2)}
      </Code>

      <Headline id="subtoken">Request Subtoken</Headline>

      <p>
        Now you can request a subtoken for an account.
        Make a request to <Code inline>https://gw2.me/api/accounts/&lt;accountId&gt;/subtoken</Code>,
        again including the <Code inline>Authorization: Bearer &lt;access_token&gt;</Code> header.
      </p>

      <p>
        The response will include the generated subtoken and the expiration timestamp of that subtoken.
      </p>

      <Code>
        {JSON.stringify({
          subtoken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpU0V6M3NBOC1PejdteUUtVTEwbW53dWM2ZlFxMzh3dm5TRU45SVlnMGdZIiwiaWF0IjoxNjk4OTI3MTA4LCJleHAiOjE2OTg5Mjc3MDgsInBlcm1pc3Npb25zIjpbImFjY291bnQiXX0.YZRAmJ8o-T6c0r4IHspy3S2Nqz7zEBtc22b36xzbL6g',
          expiresAt: '2023-11-02T12:21:48.000Z'
        }, null, 2)}
      </Code>

      <p>
        It is currently not possible to request multiple subtokens in bulk with one request.
      </p>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Access the Guild Wars 2 API',
};
