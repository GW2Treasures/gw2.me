'use client';

import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { Button } from '@gw2treasures/ui/components/Form/Button';

interface ExpandableProps {
  label: ReactNode;
  children: ReactNode
}

export const Expandable: FC<ExpandableProps> = ({ label, children }) => {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((expanded) => !expanded);
  }, []);

  return (
    <>
      <Button icon={expanded ? 'chevron-up' : 'chevron-down'} appearance="menu" onClick={toggle}>{label}</Button>
      {expanded && children}
    </>
  );
};
