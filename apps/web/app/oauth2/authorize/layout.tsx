import { ReactNode } from 'react';
import styles from './layout.module.css';

interface AuthorizeLayoutProps {
  children: ReactNode;
}

export default function AuthorizeLayout({ children }: AuthorizeLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <main className={styles.box}>
        {children}
      </main>
    </div>
  );
}
