import { getCallback, getGw2MeUrl, getPKCEPair } from '@/lib/client';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export default async function ButtonPage({ searchParams }: { searchParams: Promise<{ scope: string[] }> }) {
  const pkce = await getPKCEPair();

  const { scope } = await searchParams;

  const buttonUrl = new URL('/embed/button', getGw2MeUrl());
  buttonUrl.searchParams.set('client_id', process.env.DEMO_CLIENT_ID!);
  buttonUrl.searchParams.set('redirect_uri', getCallback());
  buttonUrl.searchParams.set('scopes', Array.isArray(scope) ? scope.join(' ') : scope);
  buttonUrl.searchParams.set('code_challenge', pkce.challenge.code_challenge);
  buttonUrl.searchParams.set('code_challenge_method', pkce.challenge.code_challenge_method);
  buttonUrl.searchParams.set('state', 'demo-state');

  return (
    <div>
      <p>This button is an <code>&lt;iframe src=&quot;https://gw2.me/embed/button&quot;&gt;</code>.</p>
      <iframe src={buttonUrl.toString()} height={36} width={250} style={{ border: 'none', overflow: 'hidden' }} allow="identity-credentials-get"/>

      <div style={{ marginBottom: 32 }}/>

      <LinkButton href="/button" icon="chevron-left">Return</LinkButton>
    </div>
  );
}

export const metadata = {
  title: 'Button',
};
