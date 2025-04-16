import { assert } from '@/lib/oauth/assert';
import { checkProof } from '@/lib/oauth/dpop';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { type PushedAuthorizationRequestResponse } from '@gw2me/client';
import { AuthorizationRequestType } from '@gw2me/database';
import { AuthorizationRequestExpiration, createAuthorizationRequest } from 'app/(authorize)/authorize/helper';
import { validateRequest } from 'app/(authorize)/oauth2/authorize/validate';
import { OAuth2RequestHandlerProps } from '../../../api/(oauth)/request';

export async function handleParRequest({ params, requestAuthorization, headers, url }: OAuth2RequestHandlerProps): Promise<PushedAuthorizationRequestResponse> {
  console.log(params);

  // get client_id from params
  const client_id = params.client_id;
  assert(client_id, OAuth2ErrorCode.invalid_request, 'Missing client_id');

  // get authorized client
  const { client } = requestAuthorization;
  assert(client.id === client_id, OAuth2ErrorCode.invalid_request, 'client_id param does not match authorization.');

  // PAR can use the DPoP header instead of the dpop_jkt param to DPoP bind the authorization request (https://datatracker.ietf.org/doc/html/rfc9449#section-10.1)
  const dpopHeader = headers.get('DPoP');

  console.log(Object.fromEntries(headers.entries()));

  if(dpopHeader) {
    // verify the proof
    const dpop = await checkProof(dpopHeader, { htm: 'POST', htu: url });

    // ensure jkt of the DPoP proof matches dpop_jkt if provided
    if(params.dpop_jkt !== undefined && params.dpop_jkt !== dpop.jkt) {
      throw new OAuth2Error(OAuth2ErrorCode.invalid_request, { description: 'dpop_jkt and the DPoP header must match if using both' });
    }

    console.log('Using DPoP in PAR');

    // bind the auth request to the public key used in the DPoP proof
    params.dpop_jkt = dpop.jkt;
  }

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
