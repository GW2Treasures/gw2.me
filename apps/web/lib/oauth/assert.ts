import { Falsy } from '../is';
import { OAuth2ErrorCode, OAuth2Error } from './error';

export function assert(condition: unknown, code: OAuth2ErrorCode = OAuth2ErrorCode.server_error, description?: string): asserts condition {
  if (!condition) {
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
