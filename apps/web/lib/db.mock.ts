import { PrismaClient } from '@gw2me/database';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import { db } from './db';

jest.mock('./db', () => ({
  __esModule: true,
  db: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(dbMock);
  dbMock.$transaction.mockImplementation(
    (arrayOrCallback) => typeof arrayOrCallback === 'function' ? arrayOrCallback(dbMock) : Promise.all(arrayOrCallback)
  );
});

export const dbMock = db as unknown as DeepMockProxy<PrismaClient>;
