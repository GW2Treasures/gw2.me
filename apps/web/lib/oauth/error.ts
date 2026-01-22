import { isTruthy } from '@gw2treasures/helper/is';
import { NextResponse } from 'next/server';

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

export interface OAuth2ErrorDetails {
  description?: string,
  httpStatus?: number,
}

export class OAuth2Error extends Error {
  public description?: string;
  public httpStatus?: number;

  constructor(public code: OAuth2ErrorCode, { description, httpStatus, ...options }: OAuth2ErrorDetails & ErrorOptions = {}) {
    super(code + (description ? ` (${description})` : ''), options);

    this.description = description;
    this.httpStatus = httpStatus;

    Object.setPrototypeOf(this, OAuth2Error.prototype);
  }
}

export interface OAuth2AuthorizationErrorDetails extends OAuth2ErrorDetails {
  schema?: 'Bearer' | 'DPoP',
}

export class OAuth2AuthorizationError extends OAuth2Error {
  public schema?: string;

  constructor(public code: OAuth2ErrorCode, { schema, ...details }: OAuth2AuthorizationErrorDetails & ErrorOptions = {}) {
    super(code, details);

    this.schema = schema;

    Object.setPrototypeOf(this, OAuth2AuthorizationError.prototype);
  }
}

export function errorToResponse(error: unknown) {
  if(error instanceof OAuth2AuthorizationError) {
    return NextResponse.json(
      { error: error.code, error_description: error.description ?? 'Unknown error' },
      {
        status: error.httpStatus ?? 401,
        headers: [
          (error.schema === undefined || error.schema === 'Bearer') && ['WWW-Authenticate', errorToWWWAuthenticate('Bearer', error)] as [string, string],
          (error.schema === undefined || error.schema === 'DPoP') && ['WWW-Authenticate', errorToWWWAuthenticate('DPoP', error)] as [string, string],
        ].filter(isTruthy)
      }
    );
  }

  if(error instanceof OAuth2Error) {
    return NextResponse.json(
      { error: error.code, error_description: error.description ?? 'Unknown error' },
      { status: error.httpStatus ?? 400 }
    );
  }

  return NextResponse.json(
    {},
    {}
  );
}

function errorToWWWAuthenticate(schema: 'Bearer' | 'DPoP', error: OAuth2Error) {
  return `${schema} error="${error.code}"${error.description ? ` error_description=${JSON.stringify(error.description)}` : ''}`;
}
