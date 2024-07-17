import { corsHeaders } from '@/lib/cors-header';
import { OAuth2Error, OAuth2ErrorCode } from '@/lib/oauth/error';
import { NextRequest, NextResponse } from 'next/server';
import { handleTokenRequest } from './token';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const params = await request.formData();

    // get all string params as object
    const parsedParams = Object.fromEntries(Array.from(params.entries()).filter(([key, value]) => typeof value === 'string')) as Record<string, string>;

    const response = await handleTokenRequest(parsedParams);

    return NextResponse.json(response, { headers: corsHeaders(request) });

  } catch (error) {
    console.error(error);

    if(error instanceof OAuth2Error) {
      // TODO: use better http status based on error.code
      return NextResponse.json(
        { error: error.code, error_description: error.description },
        { status: 500, headers: corsHeaders(request) }
      );
    }

    return NextResponse.json(
      { error: OAuth2ErrorCode.server_error, error_description: 'Internal server error' },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

export const OPTIONS = (request: Request) => {
  return new NextResponse(null, {
    headers: corsHeaders(request)
  });
};
