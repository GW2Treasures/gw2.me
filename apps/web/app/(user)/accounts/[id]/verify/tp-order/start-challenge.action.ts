'use server';

import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { createChallenge, getAccountForChallenge } from './challenge';
import { redirect } from 'next/navigation';

export async function startChallenge(accountId: string): Promise<FormState> {
  const account = await getAccountForChallenge(accountId);

  if(!account) {
    return { error: 'account' };
  }

  const challenge = await createChallenge(accountId);

  redirect(`/accounts/${accountId}/verify/tp-order?challenge=${encodeURIComponent(challenge)}`);
}
