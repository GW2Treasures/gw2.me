'use client';

import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { FC, useEffect, useState } from 'react';

interface FormatDateProps {
  date: Date
}

export const FormatDate: FC<FormatDateProps> = ({ date }) => {
  const [value, setValue] = useState(date.toUTCString());

  useEffect(() => {
    setValue(date.toLocaleString());
  }, [date]);

  return (
    <Tip tip={date.toUTCString()}>
      <time dateTime={date.toISOString()}>
        {value}
      </time>
    </Tip>
  );
};
