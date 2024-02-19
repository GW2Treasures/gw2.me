'use server';

import { createVerifier } from '@/lib/jwt';
import { TpOrderChallengeJwtPayload, getAccountForChallenge } from './challenge';
import { fetchGw2Api } from '@/lib/gw2-api-request';
import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';

type VerifyChallengeActionErrorMessageId = 'invalid_challenge' | 'account_not_found' | 'account_already_verified' | 'api_key_not_found' | 'gw2api_error' | 'pending' | 'unknown';
type VerifyChallengeActionSuccessMessageId = 'verified';

export type VerifyChallengeActionResults = VerifyChallengeActionErrorMessageId | VerifyChallengeActionSuccessMessageId;

export type VerifyChallengeActionResult =
  | { error: VerifyChallengeActionErrorMessageId, success?: never }
  | { error?: never, success: VerifyChallengeActionSuccessMessageId }
  | { success?: undefined, error?: undefined };

export async function verifyChallenge(challengeJwt: string): Promise<VerifyChallengeActionResult> {
  try {
    // get userId from session
    const { userId } = await getSessionOrRedirect();

    // verify challenge jwt
    let challenge: TpOrderChallengeJwtPayload;
    try {
      const verifyJwt = createVerifier();
      challenge = verifyJwt(challengeJwt);
    } catch(e) {
      console.error(e);
      return { error: 'invalid_challenge' };
    }

    // get account thats supposed to be verified
    const account = await getAccountForChallenge(challenge.sub);

    if(!account) {
      return { error: 'account_not_found' };
    }

    if(account.verified) {
      return { error: 'account_already_verified' };
    }

    if(account.apiTokens.length === 0) {
      return { error: 'api_key_not_found' };
    }

    // get an api key with tradingpost permission
    const apiKey = account.apiTokens[0].token;

    // fetch transaction from gw2 api
    let transactions;
    try {
      transactions = await fetchGw2Api<CommerceTransactionsCurrentSells>('/v2/commerce/transactions/current/buys', apiKey);
    } catch(e) {
      console.error(e);
      return { error: 'gw2api_error' };
    }

    // check if transactions include the challenge item
    const challengeCompleted = transactions.some(({ item_id, price }) => item_id === challenge.itm && price === challenge.cns);

    // if challenge is not yet completed, return pending error
    if(!challengeCompleted) {
      return { error: 'pending' };
    }

    // remove this account from all other users
    await db.account.deleteMany({
      where: { accountId: account.id, userId: { not: userId }},
    });

    // verify account
    await db.account.update({
      where: { id: account.id },
      data: { verified: true },
    });

    return { success: 'verified' };
  } catch(e) {
    return { error: 'unknown' };
  }
}

export type CommerceTransactionsCurrentSells = {
  id: number,
  item_id: number,
  price: number,
  quantity: number,
  created: string
}[]
