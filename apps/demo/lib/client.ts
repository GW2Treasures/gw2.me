import 'server-only';
import { Gw2MeClient } from '@gw2me/client';
import { createHash, randomBytes } from 'crypto';

export const client_id = 'example_client_id';
export const client_secret = Buffer.from('example_client_secret', 'utf-8').toString('base64url');
export const code_verifier = randomBytes(32).toString('base64url');
export const code_challenge = createHash('sha256').update(code_verifier).digest('base64url');

export const gw2me = new Gw2MeClient({ client_id, client_secret }, { url: process.env.GW2ME_URL });
