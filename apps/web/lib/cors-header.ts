const varyHeader = { Vary: 'Origin' };

export function corsHeaders(request: Request) {
  if(!request.headers.has('Origin')) {
    return varyHeader;
  }

  return {
    ...varyHeader,
    'Access-Control-Allow-Origin': request.headers.get('Origin')!,
    'Access-Control-Allow-Credentials': 'true',
    ...(request.method === 'OPTIONS' ? {
      'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Max-Age': '600'
    } : {})
  };
}
