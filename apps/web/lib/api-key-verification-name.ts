import { getSessionOrRedirect } from './session';
import { createHash } from 'crypto';

export async function getApiKeyVerificationName() {
  const session = await getSessionOrRedirect();

  const verifyKey = createHash('sha256').update(session.userId).digest('base64url').substring(0, 8);

  return `gw2.me ${verifyKey}`;
}
