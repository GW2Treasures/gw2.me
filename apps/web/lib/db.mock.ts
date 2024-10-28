import { PrismaClient } from '@gw2me/database';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { beforeEach, jest } from '@jest/globals';

export const dbMock = mockDeep<PrismaClient>();

jest.mock('./db', () => ({
  __esModule: true,
  db: dbMock,
}));

beforeEach(() => {
  mockReset(dbMock);
  dbMock.$transaction.mockImplementation(
    // @ts-expect-error any
    (arrayOrCallback) => typeof arrayOrCallback === 'function' ? arrayOrCallback(dbMock) : Promise.all(arrayOrCallback)
  );
});

