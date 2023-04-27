export const dynamic = 'force-dynamic';

async function getToken(code: string) {
  const data = new URLSearchParams({
    code,
    'client_id': 'example_client_id',
    'client_secret': 'example_client_secret',
    'grant_type': 'authorization_code',
    'redirect_uri': 'http://localhost:4001/callback',
  });

  // get discord token
  const token = await fetch('http://localhost:4000/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data,
  }).then((r) => r.json());

  return token;
}

export default async function CallbackPage({ searchParams }: { searchParams: { code: string }}) {
  const data = await getToken(searchParams.code);

  return (
    <div>
      <pre>{JSON.stringify(data, undefined, '  ')}</pre>
    </div>
  );
}
