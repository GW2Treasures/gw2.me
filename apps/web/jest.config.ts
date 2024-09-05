import nextJest from 'next/jest';
import type { Config } from 'jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: [
    'next',
    './lib/oauth/to-be-oauth2-error.jest.ts',
    './lib/db.mock.ts',
  ],

  testEnvironment: 'jest-environment-jsdom',

  // required for `jest-mock-extended`
  // See https://github.com/marchaos/jest-mock-extended/issues/116
  // TODO: replace with @jest/globals once that issue is fixed
  injectGlobals: true,

  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
