import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { startChallenge } from './tp-order/start-challenge.action';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Metadata } from 'next';

const getAccount = cache(async function getAccount(id: string) {
  const session = await getSessionOrRedirect();

  const account = await db.account.findUnique({
    where: { id, userId: session.userId },
  });

  if(!account) {
    notFound();
  }

  return account;
});

export default async function VerifyAccountPage({ params }: PageProps<'/accounts/[id]/verify'>) {
  const { id } = await params;
  const account = await getAccount(id);

  return (
    <PageLayout>
      <Headline id="verify">Verify {account.accountName}</Headline>

      <p>Verify the ownership of your account.</p>

      {account.verified ? (
        <Notice>
          Your account is already verified.
        </Notice>
      ) : (
        <Form action={startChallenge.bind(null, id)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            <LinkButton href={`/accounts/${id}/verify/api-key`} icon="key">
              <b>API key challenge</b>
              <div style={{ whiteSpace: 'normal' }}>Login to the Guild Wars 2 account website and create a new API key using a specific name.</div>
            </LinkButton>
            <SubmitButton icon="tradingpost">
              <div style={{ textAlign: 'left' }}>
                <b>Trading Post challenge</b>
                <div style={{ whiteSpace: 'normal' }}>Create a new buy-order on the trading post.</div>
              </div>
            </SubmitButton>
          </div>
        </Form>
      )}

      <LinkButton href={`/accounts/${id}`} icon="chevron-left">Cancel</LinkButton>
    </PageLayout>
  );
}

export const metadata: Metadata = {
  title: 'Verify Account'
};
