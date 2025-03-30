import { isTruthy } from "@gw2treasures/helper/is";
import { NextResponse } from "next/server";

export enum OAuth2ErrorCode {
  access_denied = 'access_denied',
  invalid_client = 'invalid_client',
  invalid_grant = 'invalid_grant',
  invalid_request = 'invalid_request',
  invalid_scope = 'invalid_scope',
  server_error = 'server_error',
  temporarily_unavailable = 'temporarily_unavailable',
  unauthorized_client = 'unauthorized_client',
  unsupported_grant_type = 'unsupported_grant_type',
  unsupported_response_type = 'unsupported_response_type',

  invalid_dpop_proof = 'invalid_dpop_proof',
  use_dpop_nonce = 'use_dpop_nonce',
}

export class OAuth2Error extends Error {
  public description?: string;

  constructor(public code: OAuth2ErrorCode, { description }: { description?: string }) {
    super(code + (description ? ` (${description})` : ''));

    this.description = description;

    Object.setPrototypeOf(this, OAuth2Error.prototype);
  }
}

export class OAuth2AuthorizationError extends OAuth2Error {
  public schema?: string;

  constructor(public code: OAuth2ErrorCode, details: { schema?: 'Bearer' | 'DPoP', description?: string }) {
    super(code, details);

    this.schema = details.schema;

    Object.setPrototypeOf(this, OAuth2AuthorizationError.prototype);
  }
}

export function errorToResponse(error: unknown) {
  if(error instanceof OAuth2AuthorizationError) {
    return NextResponse.json(
      { error: error.code, error_description: error.description ?? 'Unknown error' },
      {
        status: 401,
        headers: [
          (error.schema === undefined || error.schema === 'Bearer') && ['WWW-Authenticate', errorToWWWAuthenticate('Bearer', { error: error.code, description: error.description })] as [string, string],
          (error.schema === undefined || error.schema === 'DPoP') && ['WWW-Authenticate', errorToWWWAuthenticate('DPoP', { error: error.code, description: error.description })] as [string, string],
        ].filter(isTruthy)
      }
    );
  }

  if(error instanceof OAuth2Error) {
    return NextResponse.json(
      { error: error.code, error_description: error.description ?? 'Unknown error' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {},
    {}
  );
}

export interface OAuth2ErrorDetails {
  error: OAuth2ErrorCode,
  description?: string,
}

function errorToWWWAuthenticate(schema: 'Bearer' | 'DPoP', details: OAuth2ErrorDetails) {
  return `${schema} error="${details.error}"${details.description ? ` error_description=${JSON.stringify(details.description)}` : ''}`;
}
