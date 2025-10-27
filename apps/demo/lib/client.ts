import 'server-only';
import { type DPoPCallback, Gw2MeClient } from '@gw2me/client';
import { generatePKCEPair, type PKCEPair } from '@gw2me/client/pkce';
import { createDPoPJwt as _createDPoPJwt, generateDPoPKeyPair } from '@gw2me/client/dpop';
import { env } from './env';

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

let gw2me: Gw2MeClient;
export async function getGw2Me() {
  if(!gw2me) {
    gw2me = new Gw2MeClient({
      client_id: await env('DEMO_CLIENT_ID'),
      client_secret: await env('DEMO_CLIENT_SECRET'),
    }, {
      url: await getGw2MeUrl(),
    });
  }

  return gw2me;
}

export async function getGw2MeUrl() {
  const gw2meUrl = await env('GW2ME_URL', { optional: true });
  return gw2meUrl ?? 'https://gw2.me';
}

export async function getCallback(isDPoP: boolean) {
  const callbackUrl = await env('CALLBACK_URL', { optional: true });
  const redirect_uri = new URL(callbackUrl ?? 'https://demo.gw2.me/callback');

  if(isDPoP) {
    redirect_uri.searchParams.set('dpop', 'true');
  }

  return redirect_uri.toString();
}
