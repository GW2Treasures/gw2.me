import { FC, ReactNode } from 'react';
import styles from './NavLayout.module.css';
import { PageLayout } from './PageLayout';

export interface NavLayoutProps {
  content: ReactNode;
  children: ReactNode;
}

export const NavLayout: FC<NavLayoutProps> = ({ content, children }) => {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.side}>
        <div className={styles.nav}>
          {children}
        </div>
      </aside>
      {content}
    </div>
  );
};

export const ActiveButtonClass = styles.active;
