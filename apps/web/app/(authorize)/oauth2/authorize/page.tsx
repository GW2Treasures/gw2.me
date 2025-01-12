import { redirect } from 'next/navigation';
import { validateRequest } from './validate';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { AuthorizationRequestType } from '@gw2me/database';
import { PageProps } from '@/lib/next';
import { cancelAuthorizationRequest, createAuthorizationRequest, getPreviousAuthorizationMatchingScopes } from 'app/(authorize)/authorize/helper';
import { authorizeInternal } from 'app/(authorize)/authorize/[id]/actions';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { OAuth2ErrorCode } from '@/lib/oauth/error';

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
    // check if the user has previously authorized the same scopes
    const previousAuthorization = await getPreviousAuthorizationMatchingScopes(authorizationRequest);

    if(previousAuthorization) {
      // authorize the request. If this fails for some reason, we just ignore it and continue to redirect the user to the auth screen
      await authorizeInternal(authorizationRequest.id, previousAuthorization.accounts.map(({ id }) => id), previousAuthorization.emailId);
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
