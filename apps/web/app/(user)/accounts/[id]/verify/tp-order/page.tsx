import { PageLayout } from '@/components/Layout/PageLayout';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { notFound, redirect } from 'next/navigation';
import { TpOrderChallengeJwtPayload, getAccountForChallenge } from './challenge';
import { getItem } from './get-item';
import { createVerifier } from '@/lib/jwt';
import { TpOrderChallengeForm } from './form';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { startChallenge } from './start-challenge.action';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { renderError } from './render-error';
import { verifyChallenge } from './verify-challenge.action';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export default async function TpOrderVerifiyAccountPage({ params: { id }, searchParams: { challenge: jwt }}: { params: { id: string }, searchParams: { challenge: string }}) {
  if(!jwt) {
    redirect(`/accounts/${id}/verify`);
  }

  const account = await getAccountForChallenge(id);

  if(!account) {
    notFound();
  }

  if(account.verified) {
    redirect(`/accounts/${id}`);
  }

  let challenge: TpOrderChallengeJwtPayload;
  try {
    const verifyJwt = createVerifier();
    challenge = verifyJwt(jwt);
  } catch(e) {
    console.error(e);

    return (
      <PageLayout>
        <Headline id="verify">Verify {account.accountName}</Headline>

        <Form action={startChallenge.bind(null, id)}>
          <p>Invalid challenge.</p>
          <FlexRow>
            <LinkButton href={`/accounts/${account.id}/verify`} icon="chevron-left">Cancel</LinkButton>
            <SubmitButton icon="revision">Start new Challenge</SubmitButton>
          </FlexRow>
        </Form>
      </PageLayout>
    );
  }

  const item = await getItem(challenge.itm);

  // TODO: create subtoken instead? this is only exposed to the owner anyway, so ¯\_(ツ)_/¯
  const apiKey = account.apiTokens[0]?.token;

  return (
    <PageLayout>
      <Headline id="verify">Verify {account.accountName}</Headline>

      {!apiKey ? renderError('api_key_not_found') : (
        <TpOrderChallengeForm
          challenge={challenge}
          item={item}
          apiKey={apiKey}
          key={jwt}
          verifyAction={verifyChallenge.bind(null, jwt)}
          restartAction={startChallenge.bind(null, challenge.sub)}/>
      )}

    </PageLayout>
  );
}

export const metadata = {
  title: 'Verify Account (TP Order)'
};
