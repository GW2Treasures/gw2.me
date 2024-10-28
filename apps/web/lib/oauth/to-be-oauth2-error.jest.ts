import type { MatcherFunction } from 'expect';
import { OAuth2Error, OAuth2ErrorCode } from './error';
import { expect } from '@jest/globals';

const toBeOAuth2Error: MatcherFunction<[code?: OAuth2ErrorCode, description?: string]> = function (actual, code, description) {
  if(!(actual instanceof OAuth2Error)) {
    return { pass: false, message: () => 'expected OAuth2Error' };
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

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeOAuth2Error(code?: OAuth2ErrorCode, description?: string): void;
    toThrowOAuth2Error(code?: OAuth2ErrorCode, description?: string): void;
  }
  interface Matchers<R> {
    toBeOAuth2Error(code?: OAuth2ErrorCode, description?: string): R;
    toThrowOAuth2Error(code?: OAuth2ErrorCode, description?: string): R;
  }
}
