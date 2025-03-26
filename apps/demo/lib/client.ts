import 'server-only';
import { Gw2MeClient } from '@gw2me/client';
import { generatePKCEPair, type PKCEPair } from '@gw2me/client/pkce';
import { unstable_noStore } from 'next/cache';

const globalForPKCE = globalThis as unknown as {
  pkce: PKCEPair | undefined;
};

// generate PKCE pair on first invocation
// otherwise return cached PKCE pair because we don't store it
// reusing a PKCE pair is against the spec, but this is just a demo
// DO NOT DO IT LIKE THIS IN A REAL-WORLD APPLICATION
export async function getPKCEPair() {
  if(!globalForPKCE.pkce) {
    globalForPKCE.pkce = await generatePKCEPair();
  }

  return globalForPKCE.pkce;
}

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

export function getCallback() {
  unstable_noStore();
  return process.env.CALLBACK_URL ?? 'https://demo.gw2.me/callback';
}
