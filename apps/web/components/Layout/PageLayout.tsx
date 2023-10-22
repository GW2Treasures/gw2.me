import { FC, ReactNode } from 'react';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: ReactNode;
  thin?: boolean;
};

export const PageLayout: FC<PageLayoutProps> = ({ children, thin = false }) => {
  return (
    <main className={thin ? styles.thinPage : styles.page}>
      {children}
    </main>
  );
};
