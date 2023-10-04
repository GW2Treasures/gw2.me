'use client';

import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { ReactNode } from 'react';
import styles from './layout.module.css';
import { useSelectedLayoutSegment } from 'next/navigation';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        <LinkButton appearance="menu" href="/profile" className={segment === 'profile' ? styles.active : undefined}>Profile</LinkButton>
        <LinkButton appearance="menu" href="/accounts" className={segment === 'accounts' ? styles.active : undefined}>GW2 Accounts</LinkButton>
        <LinkButton appearance="menu" href="/providers" className={segment === 'providers' ? styles.active : undefined}>Login Providers</LinkButton>
        <LinkButton appearance="menu" href="/applications" className={segment === 'applications' ? styles.active : undefined}>Applications</LinkButton>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
