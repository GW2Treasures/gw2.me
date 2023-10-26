'use client';

import { IconProp } from '@gw2treasures/icons';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';
import { useSelectedLayoutSegment } from 'next/navigation';
import { FC, ReactNode } from 'react';
import { ActiveButtonClass } from './NavLayout';

export interface NavigationItem {
  icon: IconProp;
  segment: string;
  label: ReactNode;
}

export interface NavigationProps {
  items: NavigationItem[]
  prefix: `/${string}/`;
  children?: ReactNode;
}

export const Navigation: FC<NavigationProps> = ({ items, children, prefix }) => {
  const segment = useSelectedLayoutSegment();

  return (
    <>
      {items.map((item) => (
        <LinkButton key={item.segment} appearance="menu" href={prefix + item.segment} icon={item.icon} className={segment === item.segment ? ActiveButtonClass : undefined}>{item.label}</LinkButton>
      ))}

      {children && <Separator/>}
      {children}
    </>
  );
};
