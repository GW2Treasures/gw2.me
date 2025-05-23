import 'server-only';
import { type DPoPCallback, Gw2MeClient } from '@gw2me/client';
import { generatePKCEPair, type PKCEPair } from '@gw2me/client/pkce';
import { unstable_noStore } from 'next/cache';
import { createDPoPJwt as _createDPoPJwt, generateDPoPKeyPair } from '@gw2me/client/dpop';

const globalForPKCEAndDPoP = globalThis as unknown as {
  pkce: PKCEPair | undefined,
  dpop: CryptoKeyPair | undefined,
};

// generate PKCE pair on first invocation
// otherwise return cached PKCE pair because we don't store it
// reusing a PKCE pair is against the spec, but this is just a demo
// DO NOT DO IT LIKE THIS IN A REAL-WORLD APPLICATION
export async function getPKCEPair() {
  if(!globalForPKCEAndDPoP.pkce) {
    globalForPKCEAndDPoP.pkce = await generatePKCEPair();
  }

  return globalForPKCEAndDPoP.pkce;
}

export async function getDPoPPair() {
  if(!globalForPKCEAndDPoP.dpop) {
    globalForPKCEAndDPoP.dpop = await generateDPoPKeyPair();
  }

  return globalForPKCEAndDPoP.dpop;
}

export const createDPoPJwt: DPoPCallback = async (params) => {
  return _createDPoPJwt(params, await getDPoPPair());
};

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

export function getCallback(isDPoP: boolean) {
  unstable_noStore();

  const redirect_uri = new URL(process.env.CALLBACK_URL ?? 'https://demo.gw2.me/callback');

  if(isDPoP) {
    redirect_uri.searchParams.set('dpop', 'true');
  }

  return redirect_uri.toString();
}
