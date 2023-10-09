import { ReactNode } from 'react';
import styles from './layout.module.css';

interface AuthorizeLayoutProps {
  children: ReactNode;
}

export default function AuthorizeLayout({ children }: AuthorizeLayoutProps) {
  return <main className={styles.wrapper}>{children}</main>;
}
