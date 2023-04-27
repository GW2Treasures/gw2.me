import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';
import { DevLogin } from './dev-login';

export default async function LoginPage({ searchParams }: { searchParams: { logout?: '', error?: '' }}) {
  const user = await getUser();

  if(user) {
    redirect('/profile');
  }

  return (
    <div>
      {searchParams.error !== undefined && (
        <div data-type="warning">Unknown error</div>
      )}

      {searchParams.logout !== undefined && (
        <div>Logout successful</div>
      )}

      <a href="/auth/login/discord">Login with Discord</a>
      {process.env.NODE_ENV && (<DevLogin/>)}
    </div>
  );
}

export const metadata = {
  title: 'Login'
};
