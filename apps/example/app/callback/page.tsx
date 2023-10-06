import { client_id, client_secret, code_verifier } from '@/lib/client';
import { getAccessToken } from '@gw2me/client';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export const dynamic = 'force-dynamic';

function getToken(code: string) {
  return getAccessToken({
    code,
    client_id,
    client_secret,
    code_verifier,
    redirect_uri: 'http://localhost:4001/callback',
  });
}

export default async function CallbackPage({ searchParams }: { searchParams: { code: string }}) {
  const data = await getToken(searchParams.code);

  return (
    <div>
      <pre>{JSON.stringify(data, undefined, '  ')}</pre>

      {('error' in data) ? (
        <LinkButton href="/">Back</LinkButton>
      ) : (
        <LinkButton href={`/token?access_token=${data.access_token}&refresh_token=${data.refresh_token}`} external>Continue</LinkButton>
      )}
    </div>
  );
}
