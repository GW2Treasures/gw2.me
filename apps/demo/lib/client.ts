import 'server-only';
import { Gw2MeClient } from '@gw2me/client';
import { createHash, randomBytes } from 'crypto';

export const code_verifier = randomBytes(32).toString('base64url');
export const code_challenge = createHash('sha256').update(code_verifier).digest('base64url');

export const gw2me = new Gw2MeClient({
  client_id: process.env.DEMO_CLIENT_ID!,
  client_secret: process.env.DEMO_CLIENT_SECRET!,
}, {
  url: process.env.GW2ME_URL,
});
