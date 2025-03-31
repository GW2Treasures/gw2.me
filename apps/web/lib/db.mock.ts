import { PrismaClient } from '@gw2me/database';
import { beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

export const dbMock = mockDeep<PrismaClient>();

vi.mock('./db', () => ({
  __esModule: true,
  db: dbMock,
}));

beforeEach(() => {
  mockReset(dbMock);
  dbMock.$transaction.mockImplementation(
    (arrayOrCallback) => typeof arrayOrCallback === 'function' ? arrayOrCallback(dbMock) : Promise.all(arrayOrCallback)
  );
});

