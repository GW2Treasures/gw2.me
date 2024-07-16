import 'server-only';
import { Gw2MeClient } from '@gw2me/client';
import { createHash, randomBytes } from 'crypto';
import { unstable_noStore } from 'next/cache';

export const code_verifier = randomBytes(32).toString('base64url');
export const code_challenge = createHash('sha256').update(code_verifier).digest('base64url');

export const gw2me = new Gw2MeClient({
  client_id: process.env.DEMO_CLIENT_ID!,
  client_secret: process.env.DEMO_CLIENT_SECRET!,
}, {
  url: getGw2MeUrl(),
});

export function getGw2MeUrl() {
  unstable_noStore();
  return process.env.GW2ME_URL ?? 'https://gw2.me';
}
