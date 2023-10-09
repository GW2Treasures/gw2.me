/** @jest-environment node */
import { Scope } from '@gw2me/client';
import { verifyScopes } from './auth';

describe('API authorization', () => {
  describe('verifyScopes', () => {
    it('array', () => {
      expect(verifyScopes([Scope.Identify], [])).toBe(true);
      expect(verifyScopes([Scope.Identify], [Scope.Identify])).toBe(true);
      expect(verifyScopes([Scope.Identify], [Scope.Email])).toBe(false);
    });

    it('every', () => {
      expect(verifyScopes([Scope.Identify], { every: [] })).toBe(true);
      expect(verifyScopes([Scope.Identify], { every: [Scope.Identify] })).toBe(true);
      expect(verifyScopes([Scope.Identify], { every: [Scope.Email] })).toBe(false);
    });

    it('oneOf', () => {
      expect(verifyScopes([Scope.Identify], { oneOf: [] })).toBe(true);
      expect(verifyScopes([Scope.Identify], { oneOf: [Scope.Identify] })).toBe(true);
      expect(verifyScopes([Scope.Identify], { oneOf: [Scope.Email] })).toBe(false);
      expect(verifyScopes([Scope.Identify], { oneOf: [Scope.Email, Scope.Identify] })).toBe(true);
    });

    it('combination', () => {
      expect(verifyScopes([Scope.Identify, Scope.Email], { every: [Scope.Identify], oneOf: [Scope.Email, Scope.GW2_Account] })).toBe(true);
      expect(verifyScopes([Scope.Identify, Scope.Email], { every: [Scope.Identify], oneOf: [Scope.GW2_Account, Scope.GW2_Builds] })).toBe(false);
      expect(verifyScopes([Scope.Identify, Scope.Email], { every: [Scope.Identify, Scope.GW2_Account], oneOf: [Scope.Email] })).toBe(false);
      expect(verifyScopes([Scope.Identify, Scope.Email], { every: [Scope.Identify], oneOf: [Scope.Identify] })).toBe(true);
    });
  });
});
