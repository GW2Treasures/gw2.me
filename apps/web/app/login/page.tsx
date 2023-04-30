import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';
import { DevLogin } from './dev-login';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: { logout?: '', error?: '' }}) {
  const user = await getUser();

  if(user) {
    redirect('/profile');
  }

  return (
    <div>
      <Headline id="login">Login</Headline>

      {searchParams.error !== undefined && (
        <div data-type="warning">Unknown error</div>
      )}

      {searchParams.logout !== undefined && (
        <div>Logout successful</div>
      )}

      <LinkButton href="/auth/login/discord">Login with Discord</LinkButton>
      {process.env.NODE_ENV && (<DevLogin/>)}
    </div>
  );
}

export const metadata = {
  title: 'Login'
};
