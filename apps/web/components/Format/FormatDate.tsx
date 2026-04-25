'use client';

import { useHydrated } from '@/lib/use-hydrated';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { FC } from 'react';

interface FormatDateProps {
  date: Date,
}

export const FormatDate: FC<FormatDateProps> = ({ date }) => {
  const hydrated = useHydrated();
  const value = hydrated ? date.toLocaleString() : date.toUTCString();

  return (
    <Tip tip={date.toUTCString()}>
      <time dateTime={date.toISOString()}>
        {value}
      </time>
    </Tip>
  );
};
