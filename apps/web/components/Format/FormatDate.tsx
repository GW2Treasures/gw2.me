'use client';

import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { useSyncExternalStore } from 'react';
import { getClientNow, getServerNow, getServerNowRelative, isServerSnapshot, subscribeClock, subscribeNever, type DateStoreSnapshot } from './FormatDate.store';

const relativeUnits = [
  { unit: 'year' as const, seconds: 365 * 24 * 60 * 60 },
  { unit: 'month' as const, seconds: 30 * 24 * 60 * 60 },
  { unit: 'week' as const, seconds: 7 * 24 * 60 * 60 },
  { unit: 'day' as const, seconds: 24 * 60 * 60 },
  { unit: 'hour' as const, seconds: 60 * 60 },
  { unit: 'minute' as const, seconds: 60 },
  { unit: 'second' as const, seconds: 1 },
];

// Reuse a single formatter instance to avoid recreating Intl objects per render.
const relativeTimeFormat = new Intl.RelativeTimeFormat();

/** Formats a date using UTC fallback for non-relative server snapshots. */
function formatDate(date: Date, relative: boolean | undefined, now: DateStoreSnapshot): string {
  if (isServerSnapshot(now)) {
    return date.toUTCString();
  }

  return relative ? formatRelativeDate(date, now) : date.toLocaleString();
}

/** Formats a date relative to the provided timestamp using the largest matching time unit. */
export function formatRelativeDate(date: Date, now: number): string {
  const differenceInSeconds = (date.getTime() - now) / 1000;
  const absoluteDifferenceInSeconds = Math.abs(differenceInSeconds);

  if (absoluteDifferenceInSeconds < 5) {
    return 'now';
  }

  const { unit, seconds } = relativeUnits.find(({ seconds }) => absoluteDifferenceInSeconds >= seconds) ?? relativeUnits.at(-1)!;

  return relativeTimeFormat.format(Math.round(differenceInSeconds / seconds), unit);
}

interface FormatDateProps {
  date: Date,
  relative?: boolean,
}

/** Renders a timestamp with a UTC tooltip and client-localized display value. */
export function FormatDate({ date, relative }: FormatDateProps) {
  const now = useSyncExternalStore(relative ? subscribeClock : subscribeNever, getClientNow, relative ? getServerNowRelative : getServerNow);
  const value = formatDate(date, relative, now);

  return (
    <Tip tip={date.toUTCString()}>
      <time dateTime={date.toISOString()} style={{ whiteSpace: 'nowrap' }} suppressHydrationWarning={relative}>
        {value}
      </time>
    </Tip>
  );
}
