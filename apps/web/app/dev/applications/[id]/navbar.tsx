'use client';

import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { useSelectedLayoutSegments } from 'next/navigation';
import { FC, ReactNode } from 'react';
import styles from './navbar.module.css';

interface NavBarProps {
  items: { label: ReactNode, segment: string, href?: string }[]
  base?: '/' | `/${string}/`;
}

export const NavBar: FC<NavBarProps> = ({ items, base = '/' }) => {
  const segment = useSelectedLayoutSegments().join('/');

  return (
    <div className={styles.bar}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.segment} className={segment === item.segment ? styles.active : styles.button}>
            <LinkButton href={item.href ?? (base + item.segment)} appearance="menu" className={styles.link}>
              {item.label}
            </LinkButton>
          </li>
        ))}
      </ul>
    </div>
  );
};
