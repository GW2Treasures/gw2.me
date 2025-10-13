import { useSyncExternalStore } from 'react';

const noop = () => () => {};
const snapshot = () => true;
const serverSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(noop, snapshot, serverSnapshot);
}
