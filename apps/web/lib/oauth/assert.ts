import { Falsy } from '@gw2treasures/helper/is';
import { OAuth2ErrorCode, OAuth2Error } from './error';

/**
 * Throws a OAuth2Error when the condition is falsy.
 */
export function assert(condition: unknown, code: OAuth2ErrorCode = OAuth2ErrorCode.server_error, description?: string): asserts condition {
  if (!condition) {
    throw new OAuth2Error(code, { description });
  }
}

/**
 * Throws an OAuth2Error when the condition is truthy.
 */
export function fail(condition: unknown, code: OAuth2ErrorCode, description?: string): asserts condition is Falsy {
  assert(!condition, code, description);
}

/**
 * Tries to run the callback. If any error occurs, a OAuth2Erro will be thrown. Otherwise returns the result of the callback.
 */
export function tryOrFail<T>(callback: () => T, code: OAuth2ErrorCode, description?: string): T {
  try {
    return callback();
  } catch {
    throw new OAuth2Error(code, { description });
  }
}
