import 'server-only';
import { db } from '@/lib/db';
import { assert } from '@/lib/oauth/assert';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { AuthenticationMethod } from '@/lib/oauth/types';
import { ClientType, ClientSecret, Client } from '@gw2me/database';
import { scryptSync, timingSafeEqual } from 'crypto';
import { after } from 'next/server';

export function assertRequestAuthentication(
  client: Client & { secrets: ClientSecret[] },
  headers: Headers,
  params: Record<string, string | undefined>
): { client_secret?: string } {
  const authHeader = headers.get('Authorization');

  const authorizationMethods: Record<AuthenticationMethod, boolean> = {
    client_secret_basic: !!authHeader,
    client_secret_post: params.client_secret !== undefined,
  };

  const usedAuthentication = Object.entries(authorizationMethods)
    .filter(([, used]) => used)
    .map(([key]) => key as AuthenticationMethod);

  // no authentication provided
  if(usedAuthentication.length === 0) {
    assert(client.type === ClientType.Public, OAuth2ErrorCode.invalid_request, 'Missing authorization for confidential client');
    return {};
  }

  // if authentication was provided, this needs to be a confidential client
  assert(client.type === ClientType.Confidential, OAuth2ErrorCode.invalid_request, 'Do not pass authorization for public clients.');

  // only allow 1 authorization method
  assert(usedAuthentication.length === 1, OAuth2ErrorCode.invalid_request, 'Only used one authorization method');

  const [method] = usedAuthentication;

  switch(method) {
    case 'client_secret_basic':
    case 'client_secret_post': {
      let client_secret: string | undefined;

      if(method === 'client_secret_basic') {
        const [basic, encoded] = authHeader!.split(' ', 2);
        assert(basic === 'Basic', OAuth2ErrorCode.invalid_request, 'Only "Basic" authorization is supported using the Authorization header');

        const [id, password] = Buffer.from(encoded, 'base64').toString().split(':', 2);
        assert(id === client.id, OAuth2ErrorCode.invalid_request, 'Unexpected client_id in Authorization header');

        client_secret = password;
      } else {
        client_secret = params.client_secret;
      }

      assert(client_secret, OAuth2ErrorCode.invalid_request, 'Missing client_secret');

      const clientSecret = client.secrets.find(({ secret }) => isValidClientSecret(client_secret, secret));
      assert(clientSecret, OAuth2ErrorCode.invalid_client, 'Invalid client_secret');

      // set `usedAt` of secret
      after(() => db.clientSecret.update({
        where: { id: clientSecret.id },
        data: { usedAt: new Date() }
      }));

      return { client_secret };
    }
  }

  return {};
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
