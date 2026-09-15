import { PageLayout } from '@/components/Layout/PageLayout';
import { ProviderIcon, ProviderName } from '@/components/Provider/Provider';
import { db } from '@/lib/db';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { searchParamsToURLSearchParams } from '@/lib/next';
import { isValidProviderType } from '@/lib/provider';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { removeProvider } from './actions';
import { Metadata } from 'next';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { getSessionOrRedirect } from '@/lib/session';

export default async function RemoveProviderPage({ searchParams }: PageProps<'/providers/remove'>) {
  const parsedSearchParams = searchParamsToURLSearchParams(await searchParams);
  const provider = parsedSearchParams.get('provider');
  const providerAccountId = parsedSearchParams.get('providerAccountId');

  const session = await getSessionOrRedirect();

  if (!provider || !providerAccountId || !isValidProviderType(provider)) {
    notFound();
  }

  const userProvider = await db.userProvider.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId }, userId: session.userId },
  });

  if (!userProvider) {
    notFound();
  }

  return (
    <PageLayout>
      <Headline id="remove">Remove Login Provider</Headline>
      <p>Are you sure you want to remove this login provider?</p>
      <div className={styles.providerBox}>
        <ProviderIcon provider={userProvider.provider} className={styles.providerIcon}/>
        <div>
          <b>{userProvider.displayName}</b>
          <span className={styles.providerType}>
            <ProviderName provider={userProvider.provider}/>
          </span>
        </div>
      </div>

      <p className={styles.disclaimer}>
        You will no longer be able to use this provider to log in.
      </p>

      <Form action={removeProvider}>
        <input type="hidden" name="provider" value={userProvider.provider}/>
        <input type="hidden" name="providerAccountId" value={userProvider.providerAccountId}/>
        <FlexRow>
          <LinkButton href="/providers" icon="chevron-left">Cancel</LinkButton>
          <SubmitButton intent="delete" icon="delete">Remove</SubmitButton>
        </FlexRow>
      </Form>
    </PageLayout>
  );
}

export const metadata: Metadata = {
  title: 'Remove Login Provider',
};
