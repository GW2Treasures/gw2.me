import { redirect } from 'next/navigation';
import { getApplicationByClientId, validateRequest } from './validate';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { AuthorizationRequestType } from '@gw2me/database';
import { PageProps } from '@/lib/next';
import { cancelAuthorizationRequest, createAuthorizationRequest } from 'app/(authorize)/authorize/helper';
import { authorizeInternal } from 'app/(authorize)/authorize/[id]/actions';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export default async function AuthorizePage({ searchParams }: PageProps) {
  // validate request
  const { error, request } = await validateRequest(await searchParams);

  // show unrecoverable error
  // TODO: convert this page to a route and redirect to an error page instead?
  if(error !== undefined) {
    return <Notice type="error">{error}</Notice>;
  }

  // create and redirect to auth request
  const authorizationRequest = await createAuthorizationRequest(AuthorizationRequestType.OAuth2, request);

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
    const requestedScopes = new Set(authorizationRequest.data.scope.split(' '));
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
