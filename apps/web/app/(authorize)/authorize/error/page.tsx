import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { Metadata } from 'next';

export default async function AuthorizationErrorPage(props: PageProps<'/authorize/error'>) {
  const searchParams = await props.searchParams;

  const error = typeof searchParams.error === 'string' && searchParams.error in OAuth2ErrorCode
    ? searchParams.error as OAuth2ErrorCode
    : undefined;

  return (
    <Notice type="error">
      {error ? `There was an error during authorization: ${error}` : 'There was an unknown error during authorization.'}
    </Notice>
  );
}

export const metadata: Metadata = {
  title: 'Authorization Error'
};
