import { code_verifier, getCallback, gw2me } from '@/lib/client';
import { PageProps, SearchParams } from '@/lib/next';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export const dynamic = 'force-dynamic';

function getToken(code: string) {
  return gw2me.getAccessToken({
    code,
    code_verifier,
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

async function parseSearchParams(params: SearchParams): Promise<{ access_token: string, refresh_token?: string } | { error: string }> {
  if(params.code !== undefined) {
    try {
      return await getToken(Array.isArray(params.code) ? params.code[0] : params.code);
    } catch(e) {
      return { error: String(e) };
    }
  }

  if(params.access_token !== undefined) {
    return {
      access_token: Array.isArray(params.access_token) ? params.access_token[0] : params.access_token,
      refresh_token: Array.isArray(params.refresh_token) ? params.refresh_token[0] : params.refresh_token,
    };
  }

  throw new Error('Bad request');
}
