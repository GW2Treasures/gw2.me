'use client';

import { FC, ReactNode, useCallback, useState } from 'react';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { useHydrated } from '@/lib/use-hydrated';

interface ExpandableProps {
  label: ReactNode,
  children: ReactNode,
}

export const Expandable: FC<ExpandableProps> = ({ label, children }) => {
  const [expanded, setExpanded] = useState(false);
  const hydrated = useHydrated();

  const toggle = useCallback(() => {
    setExpanded((expanded) => !expanded);
  }, []);

  const isExpanded = expanded || !hydrated;

  // TODO: replace with <details>
  return (
    <>
      <Button icon={isExpanded ? 'chevron-up' : 'chevron-down'} appearance="menu" onClick={toggle}>{label}</Button>
      <div hidden={!isExpanded}>{children}</div>
    </>
  );
};
