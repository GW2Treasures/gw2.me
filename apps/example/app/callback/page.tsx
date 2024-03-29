import { code_verifier, gw2me } from '@/lib/client';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export const dynamic = 'force-dynamic';

function getToken(code: string) {
  return gw2me.getAccessToken({
    code,
    code_verifier,
    redirect_uri: 'http://localhost:4001/callback',
  });
}

export default async function CallbackPage({ searchParams }: { searchParams: { code: string } | object}) {
  const data = 'code' in searchParams
    ? await getToken(searchParams.code)
    : searchParams;

  return (
    <div>
      <pre>{JSON.stringify(data, undefined, '  ')}</pre>

      {!('access_token' in data) ? (
        <LinkButton href="/">Back</LinkButton>
      ) : (
        <LinkButton href={`/token?access_token=${data.access_token}&refresh_token=${(data as any).refresh_token}`} external>Continue</LinkButton>
      )}
    </div>
  );
}
