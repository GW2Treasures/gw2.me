import { getSession } from '@/lib/session';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { PageLayout } from '@/components/Layout/PageLayout';
import { LoginForm } from 'app/login/form';
import { SetLoginStatus } from './SetLoginStatus';
import { Icon } from '@gw2treasures/ui';

export const dynamic = 'force-dynamic';

export default async function FedCMLoginPage() {
  const session = await getSession();

  if(session) {
    return (
      <PageLayout thin>
        <div style={{ '--icon-size': '64px' }}>
          <Icon icon="loading" color="var(--color-brand)"/>
        </div>
        <SetLoginStatus/>
      </PageLayout>
    );
  }

  return (
    <PageLayout thin>
      <Headline id="login">Login</Headline>
      <LoginForm returnTo="/fed-cm/login"/>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Login'
};
