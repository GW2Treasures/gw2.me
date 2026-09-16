const noop = () => {};

// Explicit marker used for SSR snapshots before a client timestamp exists.
const SERVER_SNAPSHOT = Symbol('server_now');

export type DateStoreSnapshot = number | typeof SERVER_SNAPSHOT;

// Shared store state across all FormatDate instances on the page.
let clientNow: DateStoreSnapshot = SERVER_SNAPSHOT;
let clockInterval: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

export function getServerNow(): typeof SERVER_SNAPSHOT {
  return SERVER_SNAPSHOT;
}

export function getServerNowRelative(): number {
  return Date.now();
}

export function getClientNow(): DateStoreSnapshot {
  if (typeof window === 'undefined') {
    return SERVER_SNAPSHOT;
  }

  if (clientNow === SERVER_SNAPSHOT) {
    clientNow = Date.now();
  }

  return clientNow;
}

// Non-relative dates never need store updates after hydration.
export const subscribeNever: (listener: () => void) => (() => void) = () => noop;

export function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);

  // Keep newly subscribed relative dates in sync immediately.
  clientNow = Date.now();
  listener();

  if (clockInterval === undefined) {
    // Start one global minute ticker when the first relative subscriber appears.
    clockInterval = setInterval(() => {
      clientNow = Date.now();
      clockListeners.forEach((clockListener) => clockListener());
    }, 60 * 1000);
  }

  return () => {
    clockListeners.delete(listener);

    if (clockListeners.size === 0 && clockInterval !== undefined) {
      // Tear the ticker down when no relative dates remain mounted.
      clearInterval(clockInterval);
      clockInterval = undefined;
    }
  };
}

export function isServerSnapshot(snapshot: DateStoreSnapshot): snapshot is typeof SERVER_SNAPSHOT {
  return snapshot === SERVER_SNAPSHOT;
}
