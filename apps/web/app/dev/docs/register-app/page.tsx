import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Steps } from '@/components/Steps/Steps';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { List } from '@gw2treasures/ui/components/Layout/List';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import Link from 'next/link';
import styles from '../layout.module.css';

export default function DevDocsRegisterAppPage() {
  return (
    <PageLayout className={styles.layout}>
      <PageTitle>Register your Application</PageTitle>
      <p>The first step to getting an access token is to register your application.</p>

      <Steps>
        <div>You need to <Link href="/login">Login</Link> to gw2.me.</div>
        <div>Go to the page to <Link href="/dev/applications/create">Create a new application</Link>.</div>
        <div>Enter the <b>name</b> of your application. The name must be unique and should tell the user what your application is about. The name is shown to the user when authorizing your Application and on their profile under <Link href="/applications">Authorized Applications</Link>.</div>
        <div>Select the type of your application. See <Link href="#public-confidential">Public vs. Confidential Applications</Link> for the differences. You cannot change this later.</div>
        <div>Select a verified email as contact email. This email will not be shown to users and is only used for important notifications about your application.</div>
        <div>Click <b>Create Application</b>.</div>
        <div>You will get redirected to the <b>Edit Application</b> page. You can also get there by locating your app on the <Link href="/dev/applications">Your Applications</Link> page and clicking <b>Manage</b>.</div>
        <div>Note your <b>Client ID</b>. Client IDs are considered public and can be embedded in a web page&apos;s source.</div>
        <div>
          <p>If you have created a <b>Confidential</b> application, you will also need a <b>Client Secret</b>. Click <b>Generate Client Secret</b>. You must copy the secret and store it somewhere safe. Getting a new secret invalidates the previous secret, which might make your API requests fail until you update your app.</p>
          <Notice type="warning">Treat client secrets as you would your password. You must keep it confidential and never expose it to users, even in an obscured form.</Notice>
        </div>
      </Steps>

      <p>Your application is now created and you have everything necessary to <Link href="/dev/docs/access-tokens">get a token</Link>.</p>

      <Headline id="public-confidential">Public vs. Confidential Applications</Headline>

      <p>The <ExternalLink href="https://tools.ietf.org/html/rfc6749#section-2.1">OAuth 2.0 specification</ExternalLink> classifies applications as either confidential or public clients. The main difference is whether your application is able to hold secrets securely. You will need to select the type of application when registering a new application.</p>

      <p><b>Confidential applications</b> can hold credentials in a secure way without exposing them to unauthorized parties. They require a trusted backend server to store the secret(s).</p>

      <p>Confidential applications can use a Refresh Token to get a new access tokens after they expire.</p>

      <p><b>Public applications</b> cannot hold secrets securely.</p>

      <p>Public applications will not be able to refresh expired access tokens. Instead they will have to get the user to reauthorize the application. They are also required to use PKCE during the authorization flow.</p>

      <p>
        These are examples for public applications:
      </p>

      <List>
        <li>Native or mobile applications</li>
        <li>JavaScript-based client-side web application (such as a single-page app)</li>
      </List>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Register Application',
};
