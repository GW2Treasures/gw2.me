import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useSyncExternalStore } from 'react';

// this never changes
const noop = () => () => {};

export function useBrowserSupportsWebAuthn() {
  return useSyncExternalStore(noop, () => browserSupportsWebAuthn(), () => false);
}
