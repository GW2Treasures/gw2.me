import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import Link from 'next/link';
import styles from '../layout.module.css';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export default function DevDocsFedCmPage() {
  return (
    <PageLayout className={styles.layout}>
      <Notice icon="warning">
        FedCM support in gw2.me is still <b>experimental</b>.
      </Notice>

      <PageTitle>Federated Credential Management (FedCM)</PageTitle>

      <p>
        FedCM is a browser API for privacy-preserving federated authentication without the need for third-party cookies and redirects.
        You can read more about FedCM on <ExternalLink href="https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API">MDN</ExternalLink>{' '}
        or <ExternalLink href="https://developers.google.com/privacy-sandbox/cookies/fedcm">Google for Developers</ExternalLink>.
        FedCM is still an experimental technology only available in Chrome based browsers at the moment, though other browsers are working on implementing it already.
        The use of FedCM with gw2.me is optional.
      </p>
      <p>
        It is recommended that you use the <Link href="/dev/docs/libraries">gw2.me JavaScript library</Link> to initialize FedCM Authentication on your website.
        The FedCM config for gw2.me is available <Code inline>https://gw2.me/fed-cm/config.json</Code> in case you manually want to request authorization.
      </p>

      <Headline id="request">Request FedCM</Headline>
      <p>
        FedCM is an alternative to redirecting the user to the OAuth2 authorization page described in <Link href="/dev/docs/access-tokens">Getting OAuth Access Tokens</Link>.
        Instead the user will be shown a browser dialog where they can grant permission to sign in.
      </p>
      <p>
        It is possible to request specific <Link href="/dev/docs/scopes">scopes</Link> when using FedCM in browsers supporting FedCM params (Chrome 132+). If the user has not granted these scopes before,
        the user will be shown an authorization dialog using the FedCM Continuation API. All previously granted scopes are always included,
        as if <Code inline>include_granted_scopes</Code> is used with the normal OAuth2 flow. If the browser does not support FedCM params, the scopes will default to <Code inline>identify email</Code>.
      </p>
      <p>
        It is only possible to initialize FedCM authentication from an origin which matches one of the registered OAuth2 redirect URLs.
      </p>
      <p>
        To request authentication via FedCM with the gw2.me JavaScript library, call <Code inline>gw2me.fedCM.request()</Code>.
        This will return a <Code inline>Promise&lt;Credential | null&gt;</Code> that resolves to a <Code inline>Credential</Code> when the authentication is successful,
        or <Code inline>null</Code> in case the authorization fails. The <Code inline>Credential</Code> contains a string property <Code inline>token</Code>,
        which is an OAuth2 authorization code. This authorization code can be exchanged for an access token as described in <Link href="/dev/docs/access-tokens#access-token">Access Token</Link>.
      </p>

    </PageLayout>
  );
}

export const metadata = {
  title: 'Access the Guild Wars 2 API',
};
