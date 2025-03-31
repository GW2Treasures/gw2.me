import { vi } from 'vitest';

// mock after
vi.mock('next/server', () => ({
  __esModule: true,
  after: vi.fn()
}));

vi.mock('server-only', () => ({}));
