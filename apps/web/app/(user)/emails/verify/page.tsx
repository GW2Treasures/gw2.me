import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { Metadata } from 'next';

export default async function VerifyEmailPage({ searchParams }: PageProps<'/emails/verify'>) {
  const { token } = await searchParams;
  const success = await verifyEmailAddress(Array.isArray(token) ? token[0] : token);

  return (
    <PageLayout>
      <Headline id="verify">Verify email address</Headline>
      {success ? (
        <Notice icon="checkmark">Your email address was verified.</Notice>
      ) : (
        <Notice icon="cancel" type="error">Error verifying your email address.</Notice>
      )}

      <LinkButton href="/profile" icon="chevron-right">Continue to Profile</LinkButton>
    </PageLayout>
  );
}

async function verifyEmailAddress(token: string | undefined): Promise<boolean> {
  if(!token) {
    return false;
  }

  try {
    await db.userEmail.update({
      where: { verificationToken: token, verified: false },
      data: { verified: true, verifiedAt: new Date(), verificationToken: null }
    });

    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
}

export const metadata: Metadata = {
  title: 'Verify email address'
};
