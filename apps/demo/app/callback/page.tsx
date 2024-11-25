import { getCallback, getPKCEPair, gw2me } from '@/lib/client';
import { nextSearchParamsToURLSearchParams, PageProps, SearchParams } from '@/lib/next';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export const dynamic = 'force-dynamic';

async function getToken(code: string) {
  const { verifier } = await getPKCEPair();

  return gw2me.getAccessToken({
    code,
    code_verifier: verifier,
    redirect_uri: getCallback(),
  });
}

export default async function CallbackPage({ searchParams }: PageProps) {
  const data = await parseSearchParams(await searchParams);

  return (
    <div>
      <pre>{JSON.stringify(data, undefined, '  ')}</pre>

      {!('access_token' in data) ? (
        <LinkButton href="/">Back</LinkButton>
      ) : (
        <LinkButton href={`/token?access_token=${data.access_token}&refresh_token=${data.refresh_token}`} external>Continue</LinkButton>
      )}
    </div>
  );
}

export const metadata = {
  title: 'OAuth2 Callback'
};

async function parseSearchParams(searchParams: SearchParams): Promise<{ access_token: string, refresh_token?: string } | { error: string }> {
  const params = nextSearchParamsToURLSearchParams(searchParams);

  try {
    const { code } = gw2me.parseAuthorizationResponseSearchParams(params);
    return await getToken(code);
  } catch(e) {
    return { error: String(e) };
  }
}
