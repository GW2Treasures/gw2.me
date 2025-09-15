/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, type FC, useMemo } from 'react';
import { TpOrderChallengeJwtPayload } from './challenge';
import { getItem } from './get-item';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { useFormState } from 'react-dom';
import { VerifyChallengeActionResult } from './verify-challenge.action';
import { FormatDate } from '@/components/Format/FormatDate';
import { Coins } from '@/components/Format/Coins';
import { Icon } from '@gw2treasures/ui';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { renderError } from './render-error';
import { useHydrated } from '@/lib/use-hydrated';
import { useIsExpired } from '../../../../../../lib/is-expired';
import { fetchGw2Api } from '@gw2api/fetch';

export interface TpOrderChallengeFormProps {
  challenge: TpOrderChallengeJwtPayload,
  item: Awaited<ReturnType<typeof getItem>>,
  apiKey: string,
  verifyAction: () => Promise<VerifyChallengeActionResult>,
  restartAction: (state: FormState, payload: FormData) => Promise<FormState>,
}

export const TpOrderChallengeForm: FC<TpOrderChallengeFormProps> = ({ challenge, item, apiKey, verifyAction, restartAction }) => {
  // convert challenge.exp timestamp to Date
  const expiresAt = useMemo(() => new Date(challenge.exp * 1000), [challenge]);

  // track expiration of challenge
  const isExpired = useIsExpired(expiresAt);

  // get form state
  const [state, verifyChallengeAction] = useFormState<VerifyChallengeActionResult>(verifyAction, {});

  // set isSuccess if form state is successful or isError if form state is error (but not pending)
  // this is used to stop auto checking the API
  const isSuccess = !!state.success;
  const isError = state.error && state.error !== 'pending';

  // if this wasn't hydrated yet show a manual button to verify instead of auto checking the API
  const isHydrated = useHydrated();

  useEffect(() => {
    // don't check gw2 api if the challenge is already expired, has encountered an error or was successful
    if(isExpired || isError || isSuccess) {
      return;
    }

    // create abort controller to cancel active fetch when this effects destructor is called
    const abortController = new AbortController();

    // check API every 5 seconds
    const checkInterval = setInterval(async () => {
      const transactions = await fetchGw2Api('/v2/commerce/transactions/current/buys', {
        accessToken: apiKey,
        signal: abortController.signal,
        cache: 'reload',
      });

      // TODO: handle error response

      // check if challenge would be completed
      const challengeCompleted = transactions.some(({ item_id, price }) => item_id === challenge.itm && price === challenge.cns);

      // submit challenge to verify on server
      if(challengeCompleted) {
        verifyChallengeAction();
      }
    }, 5000);

    // stop interval and in progress fetch when destructuring this useEffect
    return () => {
      clearInterval(checkInterval);
      abortController.abort();
    };
  }, [challenge, apiKey, verifyChallengeAction, expiresAt, isExpired, isSuccess, isError]);

  return (
    <>
      {isSuccess ? (
        <>
          <p>Account successfully verified. You can now cancel your buy order for {item.name}.</p>
          <LinkButton href={`/accounts/${challenge.sub}`} icon="chevron-right">Continue</LinkButton>
        </>
      ) : (state.error === 'invalid_challenge' || isExpired) ? (
        <Form action={restartAction}>
          <p>Challenge expired.</p>
          <FlexRow>
            <LinkButton href={`/accounts/${challenge.sub}/verify`} icon="chevron-left">Cancel</LinkButton>
            <SubmitButton icon="revision">Start new Challenge</SubmitButton>
          </FlexRow>
        </Form>
      ) : (
        <form action={verifyChallengeAction}>
          {renderError(state.error)}

          <p>This challenge works by placing a buy order for an item on the trading post. The buy order will not be fulfilled and you can cancel the order after the challenge.</p>

          <p style={{ border: '1px solid var(--color-border-dark)', paddingBlock: 8, paddingInline: 16, backgroundColor: 'var(--color-background-light)', borderRadius: 2 }}>
            Place a buy order for <img src={item.icon} width={32} height={32} style={{ verticalAlign: -10, borderRadius: 2 }} alt=""/> <span style={{ color: '#b900b9', fontFamily: 'var(--font-bitter)' }}>{item.name}</span> for exactly <b><Coins value={challenge.cns} showZero/></b>
          </p>

          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>This challenge is only valid for 15 minutes and will expire at <FormatDate date={expiresAt}/>. It can take up to 5 minutes for orders to appear in the Guild Wars 2 API.</p>

          {isHydrated ? (
            <p><Icon icon="loading"/> Waiting for the buy order to appear in the Guild Wars 2 API. Do not close this page.</p>
          ) : (
            <p>Click the Verify button after you have placed the order.</p>
          )}

          <FlexRow>
            <LinkButton href={`/accounts/${challenge.sub}/verify`} icon="chevron-left">Cancel</LinkButton>
            {!isHydrated && <SubmitButton icon="verified">Verify</SubmitButton>}
          </FlexRow>
        </form>
      )}
    </>
  );
};

