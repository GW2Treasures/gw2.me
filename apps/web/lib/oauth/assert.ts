import { Falsy } from '@gw2treasures/helper/is';
import { OAuth2ErrorCode, OAuth2Error, OAuth2ErrorDetails } from './error';

/**
 * Throws a OAuth2Error when the condition is falsy.
 */
export function assert(condition: unknown, code: OAuth2ErrorCode = OAuth2ErrorCode.server_error, details?: OAuth2ErrorDetails | string): asserts condition {
  if (!condition) {
    throw new OAuth2Error(code, errorDetailsOrStringToErrorDetails(details));
  }
}

/**
 * Throws an OAuth2Error when the condition is truthy.
 */
export function fail(condition: unknown, code: OAuth2ErrorCode, details?: OAuth2ErrorDetails | string): asserts condition is Falsy {
  assert(!condition, code, details);
}

/**
 * Tries to run the callback. If any error occurs, a OAuth2Error will be thrown. Otherwise returns the result of the callback.
 */
export function tryOrFail<T>(callback: () => T, code: OAuth2ErrorCode, details?: OAuth2ErrorDetails | string): T {
  try {
    return callback();
  } catch(e) {
    // rethrow inner OAuth2 errors
    if(e instanceof OAuth2Error) {
      throw e;
    }

    throw new OAuth2Error(code, errorDetailsOrStringToErrorDetails(details));
  }
}

function errorDetailsOrStringToErrorDetails(details: OAuth2ErrorDetails | string | undefined): OAuth2ErrorDetails | undefined {
  return typeof details === 'string'
    ? { description: details }
    : details;
}
