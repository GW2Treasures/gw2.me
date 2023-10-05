import { FC, ReactNode } from 'react';
import styles from './NavLayout.module.css';

export interface NavLayoutProps {
  content: ReactNode;
  children: ReactNode;
}

export const NavLayout: FC<NavLayoutProps> = ({ content, children }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        {children}
      </div>
      <div className={styles.content}>
        {content}
      </div>
    </div>
  );
};

export const ActiveButtonClass = styles.active;
