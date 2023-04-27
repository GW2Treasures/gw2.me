import { getAccessToken } from '@gw2me/api';

export const dynamic = 'force-dynamic';

function getToken(code: string) {
  return getAccessToken({
    code,
    client_id: 'example_client_id',
    client_secret: 'example_client_secret',
    redirect_uri: 'http://localhost:4001/callback'
  });
}

export default async function CallbackPage({ searchParams }: { searchParams: { code: string }}) {
  const data = await getToken(searchParams.code);

  return (
    <div>
      <pre>{JSON.stringify(data, undefined, '  ')}</pre>
    </div>
  );
}
