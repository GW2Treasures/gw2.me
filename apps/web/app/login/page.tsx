import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { PageLayout } from '@/components/Layout/PageLayout';
import { LoginForm } from './form';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSession();

  if(session) {
    redirect('/profile');
  }

  const cookieStore = await cookies();

  return (
    <PageLayout thin>
      <Headline id="login">Login</Headline>

      {cookieStore.has('logout') && (
        <Notice>Logout successful</Notice>
      )}

      <LoginForm/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Login'
};
