import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import Link from 'next/link';
import styles from '../layout.module.css';
import { Highlight } from '@/components/Layout/Highlight';
import { Scope } from '@gw2me/client';

export default function DevDocsGW2APIPage() {
  return (
    <PageLayout className={styles.layout}>
      <PageTitle>Users</PageTitle>
      <p>
        If your app uses the <Link href="/dev/docs/scopes"><Code inline>{Scope.Identify}</Code> scope</Link>,
        you can access details about the user who has authorized your app.
      </p>

      <p>
        The endpoint <Code inline>https://gw2.me/api/user</Code> will return the user&apos;s id and name.
        You will need to pass the <Code inline>access_token</Code> as a header (<Code inline>Authorization: Bearer &lt;access_token&gt;</Code>).
        If the users has also authorized the <Code inline>{Scope.Email}</Code> scope, the response will additionally include the user&apos;s email address and verification status.
      </p>

      <Code>
        <Highlight language="json" code={
          JSON.stringify({
            user: {
              id: '84093c3b-a856-4bb5-856b-77b9f94a70e7',
              name: 'darthmaim',
              email: 'darthmaim@gw2.me',
              emailVerified: true
            }
          }, null, 2)
        }/>
      </Code>

      <Headline id="accounts">Settings</Headline>

      <p>
        You can optionally store settings for each user.
        This is useful if, for example, your app does not have a user database (e.g. a client-side only app) and you want to store user-specific settings.
      </p>

      <p>
        To store settings, make a <Code inline>POST</Code> request to <Code inline>https://gw2.me/api/user/settings</Code> and include a JSON object in the request body.
        You will again need to pass the <Code inline>access_token</Code> as a header (<Code inline>Authorization: Bearer &lt;access_token&gt;</Code>).
        Only valid JSON objects below 10kb are accepted.
      </p>

      <p>
        Since the settings allow storing arbitrary data, it is your responsibility to validate the schema of the settings object before using it.
      </p>

      <p>
        If you have stored settings for the user, the <Code inline>https://gw2.me/api/user</Code> endpoint will include the settings in addition to the user details in the response.
      </p>

      <Code>
        <Highlight language="json" code={
          JSON.stringify({
            user: {
              id: '84093c3b-a856-4bb5-856b-77b9f94a70e7',
              name: 'darthmaim',
            },
            settings: {
              locale: 'de-DE',
              theme: 'dark',
              display: { timer: false, items: [19675] }
            }
          }, null, 2)
        }/>
      </Code>

      <p>
        Keep in mind that, if the access token is visible to the user (e.g. in a client-side app), the user can modify these settings. Only store settings that are not critical to your app.
      </p>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Access the Guild Wars 2 API',
};
