import { PageLayout } from '@/components/Layout/PageLayout';
import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { shareAccount } from '../actions';

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

export default async function ShareAccountPage({ params }: PageProps<'/accounts/[id]/share'>) {
  const { id } = await params;
  const account = await getAccount(id);

  return (
    <PageLayout>
      <Headline id="share">Share {account.accountName}</Headline>

      {!account.verified ? (
        <>
          <p>You have to <Link href={`/accounts/${account.id}/verify`}>verify your account ownership</Link> before you can share this account.</p>
          <LinkButton href={`/accounts/${id}`} icon="chevron-left" appearance="tertiary">Cancel</LinkButton>
        </>
      ) : (
        <Form action={shareAccount}>
          <input type="hidden" name="accountId" value={account.id}/>
          <p>Enter the username of the user you want to share your account with. They will never be able to access your API keys.</p>
          <Label label="Username">
            <TextInput name="gw2.me:share-username" data-1p-ignore data-lpignore="true" data-protonpass-ignore="true" data-bwignore/>
          </Label>
          <FlexRow>
            <LinkButton href={`/accounts/${id}`} icon="chevron-left" appearance="tertiary">Cancel</LinkButton>
            <SubmitButton icon="share">Share</SubmitButton>
          </FlexRow>
        </Form>
      )}
    </PageLayout>
  );
}

export async function generateMetadata({ params }: PageProps<'/accounts/[id]/share'>): Promise<Metadata> {
  const { id } = await params;
  const account = await getAccount(id);

  return {
    title: `Share ${account.accountName}`
  };
}
