import 'server-only';
import { db } from '@/lib/db';
import { assert } from '@/lib/oauth/assert';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { AuthenticationMethod } from '@/lib/oauth/types';
import { ClientType, Client } from '@gw2me/database';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { after } from 'next/server';

export type RequestAuthorization = { client_id: string, client: Client } & (
 | { method: 'none' }
 | { method: 'client_secret_basic' | 'client_secret_post', client_secret: string }
);

export async function getRequestAuthorization(
  headers: Headers,
  params: Record<string, string | undefined>
): Promise<RequestAuthorization> {
  const authHeader = headers.get('Authorization');

  const authorizationMethods: Record<AuthenticationMethod, boolean> = {
    client_secret_basic: !!authHeader,
    client_secret_post: params.client_secret !== undefined,
  };

  const usedAuthorization = Object.entries(authorizationMethods)
    .filter(([, used]) => used)
    .map(([key]) => key as AuthenticationMethod);

  // no authentication provided
  if(usedAuthorization.length === 0) {
    // client_id is required then
    const client_id = params['client_id'];
    assert(client_id, OAuth2ErrorCode.invalid_request, 'No client_id or authorization provided');

    // load client
    const client = await db.client.findUnique({ where: { id: client_id }});
    assert(client, OAuth2ErrorCode.invalid_client, 'Invalid client_id');

    // since no authentication was provided, this has to be a public client
    assert(client.type === ClientType.Public, OAuth2ErrorCode.invalid_request, 'Missing authorization for confidential client');

    // public client, all is good :)
    return { method: 'none', client_id, client };
  }

  // only allow 1 authorization method
  assert(usedAuthorization.length === 1, OAuth2ErrorCode.invalid_request, 'Only used one authorization method');

  const [method] = usedAuthorization;

  switch(method) {
    case 'client_secret_basic':
    case 'client_secret_post': {
      let client_id: string;
      let client_secret: string;

      if(method === 'client_secret_basic') {
        const [basic, encoded] = authHeader!.split(' ', 2);
        assert(basic === 'Basic', OAuth2ErrorCode.invalid_request, 'Only "Basic" authorization is supported using the Authorization header');

        const decoded = Buffer.from(encoded, 'base64').toString();
        assert(decoded.includes(':'), OAuth2ErrorCode.invalid_request, 'Invalid basic authorization header');

        const [id, password] = decoded.split(':', 2);

        client_id = id;
        client_secret = password;

        if(params.client_id) {
          assert(params.client_id === client_id, OAuth2ErrorCode.invalid_request, 'client_id in body does not match authentication');
        }
      } else {
        assert(params.client_id, OAuth2ErrorCode.invalid_request, 'Missing client_id parameter');
        assert(params.client_secret, OAuth2ErrorCode.invalid_request, 'Missing client_secret parameter');

        client_id = params.client_id;
        client_secret = params.client_secret;
      }

      // load client
      const client = await db.client.findUnique({
        where: { id: client_id },
        include: { secrets: true }
      });
      assert(client, OAuth2ErrorCode.invalid_client, 'Invalid client_id');
      assert(client.type === 'Confidential', OAuth2ErrorCode.invalid_request, 'Invalid authorization provided for public client');

      const clientSecret = client.secrets.find(({ secret }) => isValidClientSecret(client_secret, secret));
      assert(clientSecret, OAuth2ErrorCode.invalid_client, 'Invalid client_secret');

      // set `usedAt` of secret
      after(() => db.clientSecret.update({
        where: { id: clientSecret.id },
        data: { usedAt: new Date() }
      }));

      return { method, client_id, client_secret, client };
    }
  }

  throw new OAuth2Error(OAuth2ErrorCode.invalid_request, { description: 'Unknown authorization method' });
}

function isValidClientSecret(clientSecret: string, saltedHash: string | null): boolean {
  if(saltedHash === null) {
    return false;
  }

  const [salt, hash] = saltedHash.split(':');

  const saltBuffer = Buffer.from(salt, 'base64');
  const hashBuffer = Buffer.from(hash, 'base64');
  const secretBuffer = Buffer.from(clientSecret, 'base64url');

  const derived = scryptSync(secretBuffer, saltBuffer, 32);
  return timingSafeEqual(hashBuffer, derived);
}
