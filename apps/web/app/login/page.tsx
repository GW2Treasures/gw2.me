import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { PageLayout } from '@/components/Layout/PageLayout';
import { LoginForm } from './form';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: { logout?: '', error?: '' }}) {
  const session = await getSession();

  if(session) {
    revalidatePath('/profile');
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

      <LoginForm/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Login'
};
