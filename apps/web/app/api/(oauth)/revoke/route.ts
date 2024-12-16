import { assert } from '@/lib/oauth/assert';
import { handleRequest, handleOptionsRequest } from '../request';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { db } from '@/lib/db';

export const POST = handleRequest(async ({ params, requestAuthorization }) => {
  const token = params['token'];
  assert(token, OAuth2ErrorCode.invalid_request, 'Missing token parameter');

  // load authorization
  const deleted = await db.authorization.deleteMany({
    where: { token, clientId: requestAuthorization.client.id },
  });

  assert(deleted.count > 0, OAuth2ErrorCode.invalid_request, 'Invalid token');

  // return empty response
  return {};
});

export const OPTIONS = handleOptionsRequest();
