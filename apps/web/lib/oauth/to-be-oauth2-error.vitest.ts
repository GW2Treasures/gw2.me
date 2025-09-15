import { OAuth2Error, OAuth2ErrorCode } from './error';
import { expect } from 'vitest';

type RecordValue<T> = T extends Record<string, infer X> ? X : never;
type RawMatcherFn = RecordValue<Parameters<typeof expect.extend>[0]>;
type MatcherFunction<Args extends Array<unknown>> = (this: ReturnType<typeof expect.getState>, actual: unknown, ...args: Args) => ReturnType<RawMatcherFn>;

const toBeOAuth2Error: MatcherFunction<[code?: OAuth2ErrorCode, description?: string]> = function (actual, code, description) {
  if(!(actual instanceof OAuth2Error)) {
    return { pass: false, message: () => `Expected: ${this.utils.EXPECTED_COLOR('[OAuth2Error]')}\nReceived: ${this.utils.printReceived(actual)}` };
  }

  if(code !== undefined && actual.code !== code) {
    return { pass: false, message: () => `expected OAuth2Error code ${this.utils.printReceived(actual.code)} to match ${this.utils.printExpected(code)}` };
  }
  if(description !== undefined && actual.description !== description) {
    return { pass: false, message: () => `expected OAuth2Error description ${this.utils.printReceived(actual.description)} to match ${this.utils.printExpected(description)}` };
  }

  return { pass: true, message: () => 'expected not OAuth2Error' };
};

const toThrowOAuth2Error: MatcherFunction<[code?: OAuth2ErrorCode, description?: string]> = function (actual, code, description) {
  if(typeof actual !== 'function') {
    return { pass: false, message: () => 'expected value is not a function' };
  }

  try {
    actual();
  } catch(error) {
    return toBeOAuth2Error.bind(this)(error, code, description);
  }

  return { pass: false, message: () => 'function did not throw' };
};

expect.extend({ toBeOAuth2Error, toThrowOAuth2Error });

declare module 'vitest' {
  interface AsymmetricMatchers {
    toBeOAuth2Error(code?: OAuth2ErrorCode, description?: string): void,
    toThrowOAuth2Error(code?: OAuth2ErrorCode, description?: string): void,
  }
  interface Assertion<T> {
    toBeOAuth2Error(code?: OAuth2ErrorCode, description?: string): T,
    toThrowOAuth2Error(code?: OAuth2ErrorCode, description?: string): T,
  }
}
