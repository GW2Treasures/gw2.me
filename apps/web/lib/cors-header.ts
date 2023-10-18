const varyHeader = { Vary: 'Origin' };

export function corsHeaders(request: Request) {
  if(!request.headers.has('Origin')) {
    return varyHeader;
  }

  return {
    ...varyHeader,
    'Access-Control-Allow-Origin': request.headers.get('Origin')!
  };
}
