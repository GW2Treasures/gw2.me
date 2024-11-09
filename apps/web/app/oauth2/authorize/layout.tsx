import styles from './layout.module.css';
import { LayoutProps } from '@/lib/next';

export default function AuthorizeLayout({ children }: LayoutProps) {
  return (
    <div className={styles.wrapper}>
      <main className={styles.box}>
        {children}
      </main>
    </div>
  );
}
