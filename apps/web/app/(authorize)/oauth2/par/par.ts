import { assert } from '@/lib/oauth/assert';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { type PushedAuthorizationRequestResponse } from '@gw2me/client';
import { OAuth2RequestHandlerProps } from '../../../api/(oauth)/request';
import { validateRequest } from 'app/(authorize)/oauth2/authorize/validate';
import { AuthorizationRequestExpiration, createAuthorizationRequest } from 'app/(authorize)/authorize/helper';
import { AuthorizationRequestType } from '@gw2me/database';

export async function handleParRequest({ params, requestAuthorization }: OAuth2RequestHandlerProps): Promise<PushedAuthorizationRequestResponse> {
  console.log(params);

  // get client_id from params
  const client_id = params.client_id;
  assert(client_id, OAuth2ErrorCode.invalid_request, 'Missing client_id');

  // get authorized client
  const { client } = requestAuthorization;
  assert(client.id === client_id, OAuth2ErrorCode.invalid_request, 'client_id param does not match authorization.');

  // verify authorization request
  const { request, error } = await validateRequest(params, true);
  assert(error === undefined, OAuth2ErrorCode.invalid_request, error);

  // create authorization request
  const authorizationRequest = await createAuthorizationRequest(AuthorizationRequestType.OAuth2_PAR, request);

  return {
    request_uri: `urn:ietf:params:oauth:request_uri:${authorizationRequest.id}`,
    expires_in: AuthorizationRequestExpiration[authorizationRequest.type]
  };
}
