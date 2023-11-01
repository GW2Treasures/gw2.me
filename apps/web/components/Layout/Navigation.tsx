'use client';

import { IconProp } from '@gw2treasures/icons';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import { FC, ReactNode } from 'react';
import { ActiveButtonClass } from './NavLayout';

export interface NavigationItem {
  icon?: IconProp;
  segment: string | string[];
  label: ReactNode;
}

export interface NavigationProps {
  items: NavigationItem[]
  prefix: `/${string}/`;
  children?: ReactNode;
}

export const Navigation: FC<NavigationProps> = ({ items, children, prefix }) => {
  const segments = useSelectedLayoutSegments();

  return (
    <>
      {items.map((item) => {
        const href = prefix + (Array.isArray(item.segment) ? item.segment.join('/') : item.segment);
        const isActive = Array.isArray(item.segment)
          ? item.segment.length === segments.length && item.segment.every((value, i) => value === segments[i])
          : item.segment === segments[0];

        return (
          <LinkButton key={href} appearance="menu" href={href} icon={item.icon} className={isActive ? ActiveButtonClass : undefined}>{item.label}</LinkButton>
        );
      })}

      {children && <Separator/>}
      {children}
    </>
  );
};
