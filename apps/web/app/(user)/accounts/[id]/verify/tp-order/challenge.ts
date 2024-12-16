import { expiresAt, toTimestamp } from '@/lib/date';
import { db } from '@/lib/db';
import { createSigner } from '@/lib/jwt';
import { getSessionOrRedirect } from '@/lib/session';

// items that can be part of the challenge
const itemIds = [
  // gen1 legendaries
  30684, 30687, 30692, 30693, 30695, 30699, 30688, 30696, 30700, 30702, 30703,
  30704, 30689, 30690, 30685, 30694, 30686, 30698, 30697, 30691, 30701,

  // gen3 legendaries
  96937, 96203, 95612, 95808, 96221, 95675, 97165, 96028,
  97099, 97783, 96356, 95684, 97590, 97377, 97077, 96652
];

export function createChallenge(accountId: string) {
  // pick a random item
  const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];

  // generate a price between 10 gold and 30 gold
  const coins = Math.round(Math.random() * 200000) + 100000;

  // the challenge should be valid for 15 minutes
  const expiration = expiresAt(15 * 60);

  // sign the challenge
  const sign = createSigner();
  const jwt = sign({
    sub: accountId,
    itm: itemId,
    cns: coins,
    exp: toTimestamp(expiration)
  } satisfies TpOrderChallengeJwtPayload);

  return jwt;
}

export interface TpOrderChallengeJwtPayload {
  /** The internal account.id which this challenge is for  */
  sub: string,

  /** The item.id of the challenge */
  itm: number,

  /** The coins of this challenge */
  cns: number,

  /** Expiration date of the challenge as NumericDate */
  exp: number,
}

export async function getAccountForChallenge(id: string) {
  // make sure the user is logged in and the account belongs the the current user
  const { userId } = await getSessionOrRedirect();

  // find account in db and include an api token that can be used to verify the challenge
  const account = await db.account.findUnique({
    where: { id, userId },
    select: {
      id: true,
      accountName: true,
      verified: true,
      accountId: true,
      apiTokens: {
        where: { permissions: { has: 'tradingpost' }},
        take: 1,
        select: { token: true }
      }
    }
  });

  return account;
}
