import 'server-only';

import { db } from '@/lib/db';
import { getUser } from '@/lib/session';
import { getRelayingParty } from './utils.server';
import { type FC, Suspense } from 'react';
import { SignalPasskeysClient } from './SignalPasskeys.client';

async function getAvailablePasskeyIds(userId: string) {
  const passkeys = await db.passkey.findMany({
    where: { userId },
    select: { id: true },
  });

  return passkeys.map(({ id }) => id);
}

export const SignalPasskeys: FC = async () => {
  const user = await getUser();

  // if the user is not logged in or doesn't have a WebAuthn user ID, there are no passkeys to signal
  if (!user || !user.webAuthnUserId) {
    return null;
  }

  const { rpID } = await getRelayingParty();
  const availablePasskeyIdsPromise = getAvailablePasskeyIds(user.id);

  return (
    <Suspense>
      <SignalPasskeysClient rpId={rpID} webAuthnUserId={user.webAuthnUserId} userName={user.name} availablePasskeyIds={availablePasskeyIdsPromise}/>
    </Suspense>
  );
};
