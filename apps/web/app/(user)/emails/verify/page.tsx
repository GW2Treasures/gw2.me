import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export default async function VerifyEmailPage({ searchParams: { token }}: { searchParams: { token?: string }}) {
  const success = await verifyEmailAddress(token);

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

export const metadata = {
  title: 'Verify email address'
};
