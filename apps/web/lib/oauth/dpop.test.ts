import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkProof } from './dpop';
import { beforeEach } from 'node:test';

const validJwt = 'eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiYTJ1b1RPR3NIV0d3QThtX0xjZHpCbUU4UGlkSWtUWGRwWEFhU2wtLXRPVSIsInkiOiJ2OWFlZk5tUUpHNUF1VFo3NzRxTGU5Z2pjT190eHQ0MWJiVlZLcF9aU2MwIn19.eyJpYXQiOjE3NDM0MDc5ODAsImp0aSI6IklTSklkbEowXzFBM2pDbldBMTg4NnVvRnZmSnJDSDVlZ1RnZ2tuQlV0TGMiLCJodG0iOiJQT1NUIiwiaHR1IjoiaHR0cDovL2xvY2FsaG9zdDo0MDAwL2FwaS90b2tlbiJ9.sC-Op-VONTfRSCYKUxtmKzM0IMcSYmLRpibtlAgHlUWV5jEKuc-0BpKUhGoTPx4p9ur2FTy2bIFBnnBD-Eacnw';
const validJwtWithAth = 'eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrIjp7ImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ4IjoiMTJoSGdBbUFCZjlaRm9Mak9ZTmpFejVLZjZiS00xSmRXOUpmY1J6TnNJRSIsInkiOiI5NWJBdFJRdWcyN1ptaWgzSDRaaHRZN1NGS25QNGoxV0RBOWxVWGhaWmFnIn19.eyJpYXQiOjE3NDQwMjYyMjIsImp0aSI6IlZKb21vck9FZmlRTm1aTTkzYUxCcWVaMFN6WXVXb0U0alhVUllWY2pISzgiLCJodG0iOiJQT1NUIiwiaHR1IjoiaHR0cDovL2xvY2FsaG9zdDo0MDAwL2FwaS90b2tlbiIsImF0aCI6IlpWR1dLdm5WZi14Y19yaklRb09MaFFkcFduS2NFMFRMZUN6SmNsa2FIa1kifQ.wxCv4Yf14blm7tQc7_nV8ntOtJ76Zjl6QrJMjblPgNBF6Da1qtoFV8W4a15cBSvC1wlDgQGJUj2ql5DZp11b9A';

describe('dpop', () => {
  describe('checkProof', () => {
    // vitest mock time for every test
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('verifies valid proof', async () => {
      vi.setSystemTime(new Date('2025-03-31T07:59:40Z'));

      const result = await checkProof(validJwt, {
        htm: 'POST',
        htu: new URL('http://localhost:4000/api/token'),
      });
      expect(result).toHaveProperty('jkt');
    });

    it('verifies valid proof and verifies jwk thumbprint', async () => {
      vi.setSystemTime(new Date('2025-03-31T07:59:40Z'));

      const result = await checkProof(validJwt, {
        htm: 'POST',
        htu: new URL('http://localhost:4000/api/token'),
      }, 'D4x_ofww24_Y5kCvbcuGUIFqej7InUQoKBAFzsrSCK8');
      expect(result).toHaveProperty('jkt');
    });

    it('verifies valid proof with access token', async () => {
      vi.setSystemTime(new Date('2025-04-07T11:43:42Z'));

      const result = await checkProof(validJwtWithAth, {
        htm: 'POST',
        htu: new URL('http://localhost:4000/api/token'),
        accessToken: 'RvimGG03ggmbm22nLVGm6g',
      });
      expect(result).toHaveProperty('jkt');
    });

    it('throws if htm does not match', async () => {
      vi.setSystemTime(new Date('2025-03-31T07:59:40Z'));

      await expect(
        checkProof(validJwt, {
          htm: 'GET',
          htu: new URL('http://localhost:4000/api/token'),
        })
      ).rejects.toBeOAuth2Error();
    });

    it('throws if htu does not match', async () => {
      vi.setSystemTime(new Date('2025-03-31T07:59:40Z'));

      await expect(
        checkProof(validJwt, {
          htm: 'POST',
          htu: new URL('http://localhost:4000/api/invalid'),
        })
      ).rejects.toBeOAuth2Error();
    });

    it('throws if accessToken hash does not match', async () => {
      vi.setSystemTime(new Date('2025-03-31T07:59:40Z'));

      await expect(
        checkProof(validJwt, {
          htm: 'POST',
          htu: new URL('http://localhost:4000/api/token'),
          accessToken: 'invalid-token',
        })
      ).rejects.toBeOAuth2Error();
    });

    it('throws if accessToken is not provided but ath is present', async () => {
      vi.setSystemTime(new Date('2025-04-07T11:43:42Z'));

      await expect(
        checkProof(validJwtWithAth, {
          htm: 'POST',
          htu: new URL('http://localhost:4000/api/token'),
        })
      ).rejects.toBeOAuth2Error();
    });

    it('throws if the JWT is invalid', async () => {
      vi.setSystemTime(new Date('2025-03-31T07:59:40Z'));

      await expect(
        checkProof('invalid-jwt', {
          htm: 'POST',
          htu: new URL('http://localhost:4000/api/token'),
        })
      ).rejects.toThrowError();
    });

    it('throws if thumbprint does not match expected', async () => {
      vi.setSystemTime(new Date('2025-03-31T07:59:40Z'));

      await expect(
        checkProof(validJwt, {
          htm: 'POST',
          htu: new URL('http://localhost:4000/api/token'),
        }, 'thumbprint')
      ).rejects.toThrowError();
    });
  });
});
