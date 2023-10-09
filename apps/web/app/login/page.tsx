import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';
import { DevLogin } from './dev-login';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { PageLayout } from '@/components/Layout/PageLayout';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: { logout?: '', error?: '' }}) {
  const user = await getUser();

  if(user) {
    redirect('/profile');
  }

  return (
    <PageLayout>
      <Headline id="login">Login</Headline>

      {searchParams.error !== undefined && (
        <Notice type="error">Unknown error</Notice>
      )}

      {searchParams.logout !== undefined && (
        <Notice>Logout successful</Notice>
      )}

      <FlexRow wrap>
        <LinkButton external href="/auth/login/discord">Login with Discord</LinkButton>
        {process.env.NODE_ENV !== 'production' && (<DevLogin/>)}
      </FlexRow>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Login'
};
