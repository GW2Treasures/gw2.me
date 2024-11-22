import { jest } from '@jest/globals';

// mock unstable_after
jest.mock('next/server', () => ({
  __esModule: true,
  unstable_after: jest.fn()
}));
