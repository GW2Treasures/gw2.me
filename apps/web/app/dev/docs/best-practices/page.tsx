import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import layoutStyles from '../layout.module.css';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import Link from 'next/link';
import { Code } from '@/components/Layout/Code';

export default function DevDocsScopePage() {
  return (
    <PageLayout className={layoutStyles.layout}>
      <PageTitle>Best Practices</PageTitle>
      <p>These are some best practices you should follow when integrating gw2.me into your application.</p>

      <Headline id="scopes">Scopes</Headline>
      <p>Always require the minimal scopes your application needs to function. You can use <Link href="/dev/docs/access-tokens#incremental-authorization">Incremental Authorization</Link> to request more optional scopes for advanced workflows later. Do not include scopes your application might need in the future, instead reauthorize the user once your application includes feature that require more scopes.</p>

      <Headline id="state">State</Headline>
      <p>Always use the <Code inline>state</Code> for <Link href="/dev/docs/access-tokens#user-authorization">User Authorization</Link> to prevent Cross-Site Request Forgery (CSRF) attacks.</p>

      <Headline id="invalid-tokens">Invalid Tokens</Headline>
      <p>Access and refresh tokens can become invalid for a number of reasons. Handle errors in your application and either <Link href="/dev/docs/refresh-tokens">refresh invalid access tokens</Link> or restart the authorization flow to get fresh tokens.</p>

      <Headline id="security">Security</Headline>
      <p>Make sure your application is secure and does not leak any user data. gw2.me might deactivate authorization for you if we learn about any security issues with your application.</p>

      <Headline id="branding">Branding</Headline>
      <p>Follow our <Link href="/dev/docs/branding">branding guidelines</Link>.</p>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Scopes',
};
