import { Falsy } from './is';

export enum OAuth2ErrorCode {
  access_denied = 'access_denied',
  invalid_client = 'invalid_client',
  invalid_request = 'invalid_request',
  invalid_scope = 'invalid_scope',
  server_error = 'server_error',
  temporarily_unavailable = 'temporarily_unavailable',
  unauthorized_client = 'unauthorized_client',
  unsupported_response_type = 'unsupported_response_type',
}

export class OAuth2Error extends Error {
  public description?: string;

  constructor(public code: OAuth2ErrorCode, { description }: { description?: string }) {
    super(code);

    this.description = description;

    Object.setPrototypeOf(this, OAuth2Error.prototype);
  }
}

export function assert<T>(condition: T | Falsy, code: OAuth2ErrorCode = OAuth2ErrorCode.server_error, description?: string): asserts condition is T {
  if(!condition) {
    throw new OAuth2Error(code, { description });
  }
}

export function fail(condition: unknown, code: OAuth2ErrorCode, description?: string): asserts condition is Falsy {
  assert(!condition, code, description);
}

export function tryOrFail<T>(callback: () => T, code: OAuth2ErrorCode, description?: string): T {
  try {
    return callback();
  } catch {
    throw new OAuth2Error(code, { description });
  }
}
