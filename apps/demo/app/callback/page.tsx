import { getCallback, getDPoPPair, getPKCEPair, gw2me } from '@/lib/client';
import { nextSearchParamsToURLSearchParams, PageProps, SearchParams } from '@/lib/next';
import { TokenResponse } from '@gw2me/client';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export const dynamic = 'force-dynamic';

async function getToken(code: string, isDPoP: boolean) {
  const { code_verifier } = await getPKCEPair();
  const dpopKeyPair = await getDPoPPair();

  return gw2me.getAccessToken({
    code,
    token_type: isDPoP ? 'DPoP' : 'Bearer',
    code_verifier,
    redirect_uri: getCallback(isDPoP),
    dpopKeyPair: isDPoP ? dpopKeyPair : undefined,
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
        <LinkButton href={`/token?access_token=${data.access_token}&refresh_token=${data.refresh_token}&token_type=${data.token_type}`} external>Continue</LinkButton>
      )}
    </div>
  );
}

export const metadata = {
  title: 'OAuth2 Callback'
};

async function parseSearchParams(searchParams: SearchParams): Promise<TokenResponse | { error: string }> {
  const params = nextSearchParamsToURLSearchParams(searchParams);

  try {
    const { code } = gw2me.parseAuthorizationResponseSearchParams(params);
    return await getToken(code, params.has('dpop'));
  } catch(e) {
    return { error: String(e) };
  }
}
