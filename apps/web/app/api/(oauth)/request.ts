import { corsHeaders } from '@/lib/cors-header';
import { assert } from '@/lib/oauth/assert';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthorization, RequestAuthorization } from './auth';

export interface OAuth2RequestHandlerProps {
  headers: Headers,
  params: Record<string, string | undefined>,
  requestAuthorization: RequestAuthorization,
}

export function handleRequest<T>(handler: (props: OAuth2RequestHandlerProps) => T) {
  return async (request: NextRequest) => {
    try {
      // ensure request is using application/x-www-form-urlencoded
      assert(request.headers.get('Content-Type') === 'application/x-www-form-urlencoded', OAuth2ErrorCode.invalid_request, 'Only application/x-www-form-urlencoded requests are supported.');

      // get form data and convert to object
      const params = await request.formData();
      const parsedParams = Object.fromEntries(Array.from(params.entries()).filter(([, value]) => typeof value === 'string')) as Record<string, string>;

      // authorize client
      const requestAuthorization = await getRequestAuthorization(request.headers, parsedParams);

      // handle request
      const response = await handler({
        headers: request.headers,
        params: parsedParams,
        requestAuthorization,
      });

      // return response as JSON
      return NextResponse.json(response, { headers: responseHeaders(request) });
    } catch (error) {
      console.error(error);

      if(error instanceof OAuth2Error) {
        // TODO: use better http status based on error.code
        // TODO: include WWW-Authenticate if missing authentication (see https://datatracker.ietf.org/doc/html/rfc6750#section-3)
        return NextResponse.json(
          { error: error.code, error_description: error.description },
          { status: 500, headers: responseHeaders(request) }
        );
      }

      return NextResponse.json(
        { error: OAuth2ErrorCode.server_error, error_description: 'Internal server error' },
        { status: 500, headers: responseHeaders(request) }
      );
    }
  };
}

export function handleOptionsRequest() {
  return (request: Request) => {
    return new NextResponse(null, {
      headers: corsHeaders(request)
    });
  };
}

/** Include CORS headers and `Cache-Control: no-store` */
function responseHeaders(request: NextRequest) {
  return {
    ...corsHeaders(request),
    'Cache-Control': 'no-store'
  };
}
