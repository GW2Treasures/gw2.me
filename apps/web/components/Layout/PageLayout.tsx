import { FC, ReactNode } from 'react';
import styles from './PageLayout.module.css';
import { cx } from '@gw2treasures/ui';

interface PageLayoutProps {
  children: ReactNode,
  thin?: boolean,
  className?: string,
}

export const PageLayout: FC<PageLayoutProps> = ({ children, thin = false, className }) => {
  return (
    <main className={cx(thin ? styles.thinPage : styles.page, className)}>
      {children}
    </main>
  );
};
