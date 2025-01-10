import { redirect } from 'next/navigation';
import { validateRequest } from './validate';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { AuthorizationRequestType } from '@gw2me/database';
import { PageProps } from '@/lib/next';
import { createAuthorizationRequest } from 'app/(authorize)/authorize/helper';

export default async function AuthorizePage({ searchParams }: PageProps) {
  // validate request
  const { error, request } = await validateRequest(await searchParams);

  // show unrecoverable error
  if(error !== undefined) {
    return <Notice type="error">{error}</Notice>;
  }

  // create and redirect to auth request
  const { id } = await createAuthorizationRequest(AuthorizationRequestType.OAuth2, request);
  redirect(`/authorize/${id}`);
}
