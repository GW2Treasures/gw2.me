import { describe, expect, it } from 'vitest';
import { checkProof } from './dpop';

const validJwt = 'eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiYTJ1b1RPR3NIV0d3QThtX0xjZHpCbUU4UGlkSWtUWGRwWEFhU2wtLXRPVSIsInkiOiJ2OWFlZk5tUUpHNUF1VFo3NzRxTGU5Z2pjT190eHQ0MWJiVlZLcF9aU2MwIn19.eyJpYXQiOjE3NDM0MDc5ODAsImp0aSI6IklTSklkbEowXzFBM2pDbldBMTg4NnVvRnZmSnJDSDVlZ1RnZ2tuQlV0TGMiLCJodG0iOiJQT1NUIiwiaHR1IjoiaHR0cDovL2xvY2FsaG9zdDo0MDAwL2FwaS90b2tlbiJ9.sC-Op-VONTfRSCYKUxtmKzM0IMcSYmLRpibtlAgHlUWV5jEKuc-0BpKUhGoTPx4p9ur2FTy2bIFBnnBD-Eacnw';

describe('dpop', () => {
  describe('checkProof', () => {
    it('verifies valid JWT', async () => {
      expect(await checkProof(validJwt, {  })).toBe(true);
    });
  });
});
