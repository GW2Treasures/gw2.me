import { redirect } from 'next/navigation';
import { getApplicationByClientId, validateRequest } from './validate';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { AuthorizationRequest, AuthorizationRequestType } from '@gw2me/database';
import { PageProps, SearchParams } from '@/lib/next';
import { AuthorizationRequestExpiration, cancelAuthorizationRequest, createAuthorizationRequest } from 'app/(authorize)/authorize/helper';
import { authorizeInternal } from 'app/(authorize)/authorize/[id]/actions';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { AuthorizationUrlRequestUriParams } from '@gw2me/client';
import { assert } from '@/lib/oauth/assert';
import { notExpired } from '@/lib/db/helper';
import { expiresAt } from '@/lib/date';
import { AuthorizationRequestData } from 'app/(authorize)/authorize/types';

export default async function AuthorizePage({ searchParams }: PageProps) {
  const { error, value } = await getAuthorizationRequest(await searchParams);

  // show unrecoverable error
  // TODO: convert this page to a route and redirect to an error page instead?
  if(error !== undefined) {
    return <Notice type="error">{error}</Notice>;
  }

  const { request, authorizationRequest } = value;

  // if the prompt was not consent, we can try to instantly authorize the request
  if(request.prompt !== 'consent') {
    // get session
    const session = await getSession();

    // get application grant
    const client = await getApplicationByClientId(request.client_id);
    const appGrant = session
      ? await getApplicationGrant(client.application.id, session.userId)
      : undefined;

    // check if the user has previously authorized the same scopes
    const requestedScopes = new Set(request.scope.split(' '));
    const hasEveryScopeAuthorized = appGrant && requestedScopes.values().every((scope) => appGrant.scope.includes(scope));

    if(hasEveryScopeAuthorized) {
      // authorize the request. If this fails for some reason, we just ignore it and continue to redirect the user to the auth screen
      await authorizeInternal(authorizationRequest.id, appGrant.accounts.map(({ id }) => id), appGrant.emailId);
    } else if(request.prompt === 'none') {
      // if the request has prompt=none, we have to cancel the authorization request and redirect the user back
      await cancelAuthorizationRequest(authorizationRequest.id);

      const errorUrl = await createRedirectUrl(request.redirect_uri, {
        state: request.state,
        error: OAuth2ErrorCode.access_denied,
        error_description: 'user not previously authorized',
      });

      redirect(errorUrl.toString());
    }
  }

  redirect(`/authorize/${authorizationRequest.id}`);
}

export const metadata = {
  title: 'Authorize'
};


function getApplicationGrant(applicationId: string, userId: string) {
  return db.applicationGrant.findUnique({
    where: { userId_applicationId: { userId, applicationId }},
    include: { accounts: { select: { id: true }}}
  });
}

type Optional<T> = { error: string, value?: undefined } | { error: undefined, value: T };

async function getAuthorizationRequest(params: SearchParams): Promise<Optional<{ request: AuthorizationRequestData.OAuth2, authorizationRequest: AuthorizationRequest }>> {
  if('request_uri' in params) {
    try {
      const authorizationRequest = await validatePushedRequest(params);
      return { error: undefined, value: { request: authorizationRequest.data as unknown as AuthorizationRequestData.OAuth2, authorizationRequest }};
    } catch(e) {
      console.log(e);
      if(e instanceof OAuth2Error) {
        return { error: e.message };
      }
      return { error: 'Unknown error' };
    }
  }

  // validate request
  const { error, request } = await validateRequest(params, false);

  if(error !== undefined) {
    return { error };
  }

  // create auth request
  const authorizationRequest = await createAuthorizationRequest(AuthorizationRequestType.OAuth2, request);
  return { error, value: { request, authorizationRequest }};
}

async function validatePushedRequest(params: Partial<AuthorizationUrlRequestUriParams & { client_id: string }>) {
  const clientId = params.client_id;
  assert(clientId, OAuth2ErrorCode.invalid_request, 'client_id is missing');

  const requestUri = params.request_uri;
  assert(requestUri, OAuth2ErrorCode.invalid_request, 'Invalid request_uri');

  const expectedPrefix = 'urn:ietf:params:oauth:request_uri:';
  assert(requestUri.startsWith(expectedPrefix), OAuth2ErrorCode.invalid_request, 'Invalid request_uri');

  const authorizationId = requestUri.substring(expectedPrefix.length);
  assert(authorizationId, OAuth2ErrorCode.invalid_request, 'Invalid request_uri');

  const authorizationRequest = await db.authorizationRequest.findUnique({
    where: { id: authorizationId, type: 'OAuth2_PAR', state: 'Pushed', ...notExpired }
  });
  assert(authorizationRequest, OAuth2ErrorCode.invalid_request, 'Invalid request_uri');

  // ensure the client_id matches
  assert(authorizationRequest.clientId === clientId, OAuth2ErrorCode.invalid_request, 'Invalid client_id');

  // update authorization request to pending and set expiration
  await db.authorizationRequest.update({
    where: { id: authorizationRequest.id },
    data: {
      state: 'Pending',
      expiresAt: expiresAt(AuthorizationRequestExpiration[AuthorizationRequestType.OAuth2])
    }
  });

  return authorizationRequest;
}
