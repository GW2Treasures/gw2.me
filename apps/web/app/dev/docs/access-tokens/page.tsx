import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Steps } from '@/components/Steps/Steps';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { List } from '@gw2treasures/ui/components/Layout/List';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import Link from 'next/link';
import styles from '../layout.module.css';
import { Highlight } from '@/components/Layout/Highlight';

export default function DevDocsAccessTokensPage() {
  return (
    <PageLayout className={styles.layout}>
      <PageTitle>Getting OAuth Access Tokens</PageTitle>
      <p>To access gw2.me APIs to get info about the user or generate subtokens to access the Guild Wars 2 API you will need an access token. To get an access token the user needs to authorize your application first.</p>

      <Headline id="user-authorization">User Authorization</Headline>
      <p>
        The first step is to get the user to authorize your application&apos;s access.
        Navigate the user to <Code inline>https://gw2.me/oauth2/authorize</Code>.
        If your application is a website, you can for example use a hyperlink, a form or a redirect.
        Native and mobile applications should open the default browser.
        Don&apos;t use iframes or embedded browsers.
      </p>

      <p>
        You can also used <Link href="#par">Pushed Authorization Requests (PAR)</Link>.
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
            <td><Code inline>response_type</Code></td>
            <td><Code inline borderless>&quot;code&quot;</Code></td>
            <td>Must be <Code inline>code</Code> for authorization code grant. Other grants are not supported at the moment.</td>
          </tr>
          <tr>
            <td><Code inline>redirect_uri</Code></td>
            <td><Code inline borderless>URL</Code></td>
            <td>The URL the user will be redirected back to after authorization. Must be an exact URL configured in your application settings.</td>
          </tr>
          <tr>
            <td><Code inline>client_id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_id</Code> of your application.</td>
          </tr>
          <tr>
            <td><Code inline>scope</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>List of <Link href="/dev/docs/scopes">scopes</Link> separated by spaces.</td>
          </tr>
          <tr>
            <td><Code inline>include_granted_scopes</Code> (optional)</td>
            <td><Code inline borderless>&quot;true&quot;</Code></td>
            <td>If this parameter is <Code inline>true</Code>, all previously authorized scopes will be included. This can be used for <Link href="#incremental-authorization">incremental authorization</Link>.</td>
          </tr>
          <tr>
            <td><Code inline>prompt</Code> (optional)</td>
            <td><Code inline borderless>&quot;none&quot; | &quot;consent&quot;</Code></td>
            <td>
              <List>
                <li><Code inline>none</Code> - no consent screen will be shown. If the user is not already authenticated this will return an error.</li>
                <li><Code inline>consent</Code> - always display a consent screen.</li>
                <li>If no value is specified and the user has not previously authorized access, the user will be shown a consent screen. Subsequent requests will not show the consent screen.</li>
              </List>
            </td>
          </tr>
          <tr>
            <td><Code inline>state</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>Recommended string to improve security by preventing Cross-Site Request Forgery (CSRF) attacks. If the state returned to your redirect url does not match the state you provided in the request, the response should be ignored. The state string should be randomly generated and unique for each OAuth request.</td>
          </tr>
          <tr>
            <td><Code inline>code_challenge</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td><Link href="#pkce">PKCE</Link> challenge. Required for public applications.</td>
          </tr>
          <tr>
            <td><Code inline>code_challenge_method</Code> (optional)</td>
            <td><Code inline borderless>&quot;S256&quot;</Code></td>
            <td><Link href="#pkce">PKCE</Link> challenge method. Only SHA-256 is supported.</td>
          </tr>
          <tr>
            <td><Code inline>dpop_jkt</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>JWK Thumbprint of the public key used for <Link href="#dpop">DPoP</Link>.</td>
          </tr>
          <tr>
            <td><Code inline>verified_accounts_only</Code> (optional)</td>
            <td><Code inline borderless>&quot;true&quot;</Code></td>
            <td>Only allow the user to select verified accounts. This requires the <Link href="/dev/docs/scopes"><Code inline>accounts.verified</Code> scope</Link>.</td>
          </tr>
        </tbody>
      </Table>

      <p>An example request could look like this (URL formatted for better readability)</p>

      <Code>
        https://gw2.me/oauth2/authorize<br/>  ?client_id=1554a6a3-8b8e-4ba7-9c5f-80576d081e10<br/>  &response_type=code<br/>  &redirect_uri=http%3A%2F%2Fexample.com%2Fcallback<br/>  &scope=identify+email+gw2%3Aaccount<br/>  &state=SaOfpb7Ny9mbV6EPCUDcnQ<br/>  &code_challenge=oFtTjTxdlTh9Tdwe8Rpbly8Qy8AL5rfKc9aueH_PmZM<br/>  &code_challenge_method=S256
      </Code>

      <p>If the user is not logged in to gw2.me yet, they get asked to login first. The user is then presented with a authorization page that shows your applications name, icon and all required scopes. If you requested any scopes for the Guild Wars 2 API, the user has to select at least one Guild Wars 2 account. The user can also add additional accounts on this screen.</p>
      <p>After the user authorized your application, the user is redirected to the specified <Code inline>redirect_uri</Code>.</p>

      <p>If the authorization was successful, the url will contain the query parameter <Code inline>code</Code> with an authorization code that needs to be exchanged for an access token in the next step.</p>
      <Code>https://example.com/callback<br/>  ?state=SaOfpb7Ny9mbV6EPCUDcnQ<br/>  &iss=https%3A%2F%2Fgw2.me<br/>  &<strong>code=ciA-F7NVbINw1dcEVeYdww</strong></Code>

      <p>If the authorization was not successful, the url will contain the <Code inline>error</Code> and <Code inline>error_description</Code> query parameters detailing the reason.</p>
      <Code>https://example.com/callback<br/>  ?state=SaOfpb7Ny9mbV6EPCUDcnQ<br/>  &iss=https%3A%2F%2Fgw2.me<br/>  &<strong>error=access_denied</strong><br/>  &<strong>error_description=user+canceled+authorization</strong></Code>

      <p>
        The url for both the success and error response will always contain <Code inline>iss</Code> and
        (if passed to the authorization request) <Code inline>state</Code>, both of which should be verified.
        See <Link href="#issuer-identification">Issuer Identification</Link> for more details on the <Code inline>iss</Code> parameter.
      </p>

      <Headline id="access-token">Access Token</Headline>

      <p>Next you will have to exchange the authorization code obtained in the first step for an access token (and refresh token).</p>

      <p>You will have to make a POST request with <Code inline>Content-Type: application/x-www-form-urlencoded</Code> to <Code inline>https://gw2.me/api/token</Code> with the following parameters included in the body.</p>

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
            <td><Code inline borderless>&quot;authorization_code&quot;</Code></td>
            <td>Should be <Code inline>authorization_code</Code> to exchange your authorization code for an access token.</td>
          </tr>
          <tr>
            <td><Code inline>code</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The authorization code received as callback from the authorization request.</td>
          </tr>
          <tr>
            <td><Code inline>client_id</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_id</Code> of your application.</td>
          </tr>
          <tr>
            <td><Code inline>client_secret</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>The <Code inline>client_secret</Code> of your application. Only required for your confidential applications.</td>
          </tr>
          <tr>
            <td><Code inline>redirect_uri</Code></td>
            <td><Code inline borderless>String</Code></td>
            <td>This must be the same <Code inline>redirect_uri</Code> as used in the authorization request.</td>
          </tr>
          <tr>
            <td><Code inline>code_verifier</Code> (optional)</td>
            <td><Code inline borderless>String</Code></td>
            <td>PKCE challenge verifier used to calculate <Code inline>code_challenge</Code>.</td>
          </tr>
        </tbody>
      </Table>

      <p>
        Confidential applications have to authenticate themselves using their client secret.
        The client secret can either be passed using &quot;Basic&quot; HTTP Authentication (also called <Code inline>client_secret_basic</Code> in the context of OAuth2),
        using the <Code inline>client_id</Code> as username and the <Code inline>client_secret</Code> as password,
        or by using <Code inline>client_secret_post</Code> auth, passing the <Code inline>client_secret</Code> as
        body parameter as part of the token response.
      </p>

      <p>If the request is successful, the response will contain the access token used to access any other API endpoints.</p>

      <Code>
        <Highlight language="json" code={
          JSON.stringify({
            'access_token': 'xl1eSPfCpUNdQiIPe4TAag',
            'issued_token_type': 'urn:ietf:params:oauth:token-type:access_token',
            'token_type': 'Bearer',
            'expires_in': 604800,
            'refresh_token': 'mcn6FMwoiufzqcBDVwzOnz_NvGn-1ezzRKIm7vN_bsk',
            'scope': 'identify accounts gw2:account'
          }, null, 2)
        }/>
      </Code>


      <Headline id="next-steps">Next Steps</Headline>
      <List numbered>
        <li><Link href="/dev/docs/refresh-tokens">Refresh Tokens</Link> when they expire.</li>
        <li><Link href="/dev/docs/gw2-api">Generate a Guild Wars 2 Subtoken</Link> to access the Guild Wars 2 API.</li>
        <li>Check the <Link href="/dev/docs/api-reference">API Reference</Link> for a list of all available APIs.</li>
      </List>


      <Headline id="incremental-authorization">Incremental Authorization</Headline>

      <p>
        It is best practice to only request access to scopes at the time you need them.
        Users are more likely to authorize your app if you require fewer permissions and the
        user knows what the different permissions are used for.
        You can request additional scopes later by navigating the user to the authorization page again.
        If you include the <Code inline>include_granted_scopes</Code> query parameter
        when requesting user authorization, the access token will include all requested scopes
        in addition to all previously granted scopes.
      </p>

      <p>
        For example you could just request the <Code inline>identity</Code> scope at log in,
        and then later request additional permissions once the user starts a specific workflow in your app.
        If the user logs in again later, the granted scopes would usually not include the scopes required by the advanced workflow.
        But if the login request contains <Code inline>include_granted_scopes</Code>, the access token
        generated by the login will already contain those extra scopes, because they were granted before.
      </p>

      <Headline id="pkce">Proof Key for Code Exchange (PKCE)</Headline>

      <p>
        Proof Key for Code Exchange (PKCE) is a method to prevent code interception attacks.
        PKCE is required for public applications, and recommended for confidential applications.
        The method is described in the <ExternalLink href="https://datatracker.ietf.org/doc/html/rfc7636">RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients</ExternalLink>.
      </p>

      <Steps>
        <div>First your application has to generate a high-entropy cryptographic random string called <Code inline>code_verifier</Code>.</div>
        <div>You then have to hash the <Code inline>code_verifier</Code> using SHA-256.</div>
        <div>When you request authorization, you pass the generated hash as <Code inline>code_challenge</Code> and set <Code inline>code_challenge_method</Code> to <Code inline>S256</Code>.</div>
        <div>After authorization, you now add the <Code inline>code_verifier</Code> to the access token request.</div>
        <div>
          The server verifies the the <Code inline>code_verifier</Code> by comparing its hash with the earlier provided <Code inline>code_challenge</Code>.
          Only if it matches the server responds with an access token.
        </div>
      </Steps>

      <Headline id="dpop">Demonstration Proof of Possession (DPoP)</Headline>
      <p>
        DPoP is a method to prevent replay attacks by binding the access token to the client and
        is described in <ExternalLink href="https://datatracker.ietf.org/doc/html/rfc9449">RFC 9449</ExternalLink>.
      </p>
      <p>
        Access tokens can be bound to a specific client by supplying a DPoP proof in a <Code inline>DPoP</Code> header.
        The DPoP proof is a signed JWT that contains the <Code inline>jkt</Code> of the public key used to sign the proof.
        The supported algorithms are listed in the <Link href="/dev/docs#urls">Authorization Server Metadata</Link>.
        DPoP bound access tokens use the <Code inline>DPoP</Code> token type instead of <Code inline>Bearer</Code>.
        The <Code inline>DPoP</Code> proof header must be included in all requests using DPoP bound tokens to the API.
      </p>
      <p>
        Authorization codes (both generated by the regular authorization flow and PAR) can also be DPoP-bound,
        by sending the JWK thumbprint of the DPoP public key as <Code inline>dpop_jkt</Code> parameter in the authorization request or
        by sending a DPoP proof header for PAR.
      </p>
      <p>
        In the future, using DPoP will allow public clients to receive refresh tokens,
        as DPoP can be used to sender-constrain the token and improve security.
      </p>
      <p>
        Refresh tokens for confidential clients are never DPoP-bound, as they are already sender-constrained using client authorization.
      </p>
      <p>
        The key pair has to be stored in a secure storage. Confidential applications should store it in a secure Database,
        client-side web applications should store it as a non-exportable CryptoKeyPair in IndexedDB,
        and native clients should use secure APIs provided by the operating system.
      </p>

      <Headline id="issuer-identification">Issuer Identification</Headline>

      <p>
        The authorization response contains the <Code inline>iss</Code> parameter.
        This parameter is part of <ExternalLink href="https://datatracker.ietf.org/doc/html/rfc9207">RFC 9207 - OAuth 2.0 Authorization Server Issuer Identification</ExternalLink> and
        contains the issuer identifier, which is always <Code inline>https://gw2.me</Code> for gw2.me.
      </p>
      <p>
        All clients should verify that this parameter exactly matches to prevent mix-up attacks.
      </p>

      <Headline id="par">Pushed Authorization Requests (PAR)</Headline>
      <p>
        Pushed Authorization Requests (<ExternalLink href="https://datatracker.ietf.org/doc/html/rfc9126">RFC 9126</ExternalLink>)
        are a confidential and integrity-protected alternative to directly requesting the authorization.
        PAR allows gw2.me to authenticate the client before any user interaction happens. Thanks to this added security,
        redirect URIs don&apos;t have to be pre registered for confidential clients.
      </p>
      <p>
        To push an authorization request to gw2.me, post the same parameters as for the
        normal <Code inline>/oauth2/authorize</Code> endpoint described
        in <Link href="#user-authorization">User Authorization</Link> as <Code inline>application/x-www-form-urlencoded</Code> to
        the <Code inline>/oauth2/par</Code> endpoint.
      </p>
      <p>
        A request could look like this (formatted for better readability):
      </p>

      <Code>
        {[
          'POST /oauth2/par',
          'Host: gw2.me',
          'Content-Type: application/x-www-form-urlencoded',
          '',
          '&client_id=1554a6a3-8b8e-4ba7-9c5f-80576d081e10',
          '&response_type=code',
          '&redirect_uri=http%3A%2F%2Fexample.com%2Fcallback',
          '&scope=identify+email+gw2%3Aaccount',
          '&state=SaOfpb7Ny9mbV6EPCUDcnQ',
          '&code_challenge=oFtTjTxdlTh9Tdwe8Rpbly8Qy8AL5rfKc9aueH_PmZM',
          '&code_challenge_method=S256'
        ].join('\n')}
      </Code>

      <p>
        The server will respond with a <Code inline>request_uri</Code>:
      </p>

      <Code>
        <Highlight language="json" code={
          JSON.stringify({
            request_uri: 'urn:ietf:params:oauth:request_uri:5aac9d50-43de-4dd6-9693-a0e2ac48271f',
            expires_in: 60
          }, null, 2)
        }/>
      </Code>

      <p>
        The received <Code inline>request_uri</Code> can then be passed to to the normal authorize endpoint,
        together with the <Code inline>client_id</Code>, to continue with the normal OAuth2 authorization flow.
      </p>

      <Code>
        {[
          'https://gw2.me/oauth2/authorize',
          '  ?client_id=1554a6a3-8b8e-4ba7-9c5f-80576d081e10',
          '  &request_uri=' + encodeURIComponent('urn:ietf:params:oauth:request_uri:5aac9d50-43de-4dd6-9693-a0e2ac48271f')
        ].join('\n')}
      </Code>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Getting OAuth Access Tokens',
};
