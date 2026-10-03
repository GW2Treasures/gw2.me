import 'server-only';

import { getBaseUrlFromHeaders } from '@/lib/url';

export async function getRelayingParty() {
  const url = await getBaseUrlFromHeaders();

  return {
    rpName: 'gw2.me',
    rpID: url.hostname,
    origin: url.origin,
  };
}
