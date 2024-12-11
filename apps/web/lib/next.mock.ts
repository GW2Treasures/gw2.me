import { jest } from '@jest/globals';

// mock after
jest.mock('next/server', () => ({
  __esModule: true,
  after: jest.fn()
}));
