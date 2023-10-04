/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';
import { AuthorizeRequestParams, hasGW2Scopes, validateRequest } from './validate';
import { db } from '@/lib/db';
import { AuthorizeForm } from './form';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export default async function AuthorizePage({ searchParams }: { searchParams: AuthorizeRequestParams & Record<string, string> }) {
  // build return url for /account/add?return=X
  const self_uri = `/oauth2/authorize?${new URLSearchParams(searchParams).toString()}`;

  // validate request
  const validatedRequest = await validateRequest(searchParams);

  if(validatedRequest.error !== undefined) {
    return <Notice type="error">{validatedRequest.error}</Notice>;
  }

  // get current user
  const user = await getUser();

  // redirect to login if user is not logged in
  if(!user) {
    const encodedReturnUrl = Buffer.from(self_uri).toString('base64url');
    redirect('/login/return?to=' + encodeURIComponent(encodedReturnUrl));
  }

  // get accounts
  const accounts = hasGW2Scopes(validatedRequest.scopes)
    ? await db.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      })
    : [];

  // build cancel url
  const cancelUrl = new URL(searchParams.redirect_uri);
  cancelUrl.searchParams.set('error', 'access_denied');
  searchParams.state && cancelUrl.searchParams.set('state', searchParams.state);

  return (
    <AuthorizeForm
      application={validatedRequest.application}
      accounts={accounts}
      userName={user.name}
      scopes={validatedRequest.scopes}
      redirect_uri={searchParams.redirect_uri}
      state={searchParams.state}
      cancel_uri={cancelUrl.toString()}
      self_uri={self_uri}/>
  );
}
