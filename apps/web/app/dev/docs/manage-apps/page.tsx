import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Steps } from '@/components/Steps/Steps';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { List } from '@gw2treasures/ui/components/Layout/List';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import Link from 'next/link';
import styles from '../layout.module.css';
import { Table } from '@gw2treasures/ui/components/Table/Table';

export default function DevDocsRegisterAppPage() {
  return (
    <PageLayout className={styles.layout}>
      <PageTitle>Manage Applications</PageTitle>

      <Headline id="register">Register your Application</Headline>
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
          <p>If you have created a <b>Confidential</b> application, you will also need a <b>Client Secret</b>. Click <b>Generate Client Secret</b>. You must copy the secret and store it somewhere safe.</p>
          <Notice type="warning">Treat client secrets as you would your password. You must keep it confidential and never expose it to users, even in an obscured form.</Notice>
        </div>
      </Steps>

      <p>Your application is now created and you have everything necessary to <Link href="/dev/docs/access-tokens">get a token</Link>.</p>


      <Headline id="settings">Application settings</Headline>
      <p>These are the general settings of each application that can be edited after registering.</p>
      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Setting</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Image</td>
            <td>A image to easily identify the application. The image will be resized to 128x128 pixels and svgs will be rasterized. The image will always be shown next to the application name.</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>The unique name of the application. Users will see the name when authorizing applications and in their list of authorized applications.</td>
          </tr>
          <tr>
            <td>Description</td>
            <td>A short description of the application. Currently only shown on the <Link href="/discover">Discover</Link> page.</td>
          </tr>
          <tr>
            <td>Contact Email</td>
            <td>The contact email is used for important notifications about the application. This email is not shown to users.</td>
          </tr>
          <tr>
            <td>Public</td>
            <td>Public applications will be shown on the <Link href="/discover">Discover</Link> page.</td>
          </tr>
          <tr>
            <td>Public URL</td>
            <td>The URL of the application. This is required for public applications. The URL will be shown on the <Link href="/discover">Discover</Link> page.</td>
          </tr>
          <tr>
            <td>Privacy Policy URL</td>
            <td>Link to the privacy policy of the applications. This is shown to users when authorizing the application.</td>
          </tr>
          <tr>
            <td>Terms of Service URL</td>
            <td>Link to the terms of service of the applications. This is shown to users when authorizing the application.</td>
          </tr>
        </tbody>
      </Table>

      <Headline id="client">OAuth2 Client Settings</Headline>
      <p>These settings can be used to configure the OAuth2 client.</p>

      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Setting</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Type</td>
            <td>The type of the OAuth2 client. This cannot be changed after creation. See <Link href="#public-confidential">Public vs. Confidential Applications</Link> for the differences.</td>
          </tr>
          <tr>
            <td>Client ID</td>
            <td>The public identifier of the OAuth2 client. This is used to identify the client to the authorization server.</td>
          </tr>
          <tr>
            <td>Client Secrets</td>
            <td>
              <p>The secrets used to authenticate the client to the authorization server. Only available for confidential clients. You can create multiple client secrets to allow for key rotation. Deleting a client secret instantly invalidates it.</p>
              <Notice type="warning">Treat client secrets as you would your password. You must keep it confidential and never expose it to users, even in an obscured form.</Notice>
            </td>
          </tr>
          <tr>
            <td>Redirect URIs</td>
            <td>List of allowed redirect URLs. Only https URLs are allowed. The URLs have to be exact matches, including the port and path. Localhost URLs can use http and don&apos;t need to specify a port.</td>
          </tr>
        </tbody>
      </Table>

      <Headline id="public-confidential">Public vs. Confidential Applications</Headline>
      <p>The <ExternalLink href="https://tools.ietf.org/html/rfc6749#section-2.1">OAuth 2.0 specification</ExternalLink> classifies applications as either confidential or public clients. The main difference is whether your application is able to hold secrets securely. You will need to select the type of application when registering a new application.</p>

      <p><b>Confidential applications</b> can hold credentials in a secure way without exposing them to unauthorized parties. They require a trusted backend server to store the secret(s).</p>
      <p>Confidential applications can use a Refresh Token to get a new access tokens after they expire.</p>

      <p><b>Public applications</b> cannot hold secrets securely.</p>
      <p>Public applications will not be able to refresh expired access tokens. Instead they will have to get the user to reauthorize the application. They are also required to use PKCE during the authorization flow.</p>

      <p>These are examples for public applications:</p>
      <List>
        <li>Native or mobile applications</li>
        <li>JavaScript-based client-side web application (such as a single-page app)</li>
      </List>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Manage Applications',
};
