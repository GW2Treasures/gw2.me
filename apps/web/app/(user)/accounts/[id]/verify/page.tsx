import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';


interface VerifiyAccountPageProps {
  params: {
    id: string;
  };
}

const getAccount = cache(async function getAccount(id: string) {
  const session = await getSession();

  if(!session) {
    redirect('/login');
  }

  const account = await db.account.findUnique({
    where: { id, userId: session.userId },
  });

  if(!account) {
    notFound();
  }

  return account;
});

export default async function VerifiyAccountPage({ params }: VerifiyAccountPageProps) {
  const account = await getAccount(params.id);

  return (
    <PageLayout>
      <Headline id="verify">Verify {account.accountName}</Headline>

      <p>Verify the ownership of your account.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <LinkButton href={`/accounts/${params.id}/verify/api-key`} icon="key">
          <b>API key challenge</b>
          <div>Login to the Guild Wars 2 account website and create a new API key using a specific name.</div>
        </LinkButton>
        <Button icon="tradingpost" disabled>
          <div style={{ textAlign: 'left' }}>
            <b>Trading Post challenge</b> (coming soon)
            <div>Create a new buy-order on the trading post.</div>
          </div>
        </Button>
      </div>

      <LinkButton href={`/accounts/${params.id}`} icon="chevron-left">Cancel</LinkButton>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Verify Account'
};
