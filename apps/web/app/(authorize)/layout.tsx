import styles from './layout.module.css';

export default function AuthorizeLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className={styles.wrapper}>
      <main className={styles.box}>
        {children}
      </main>
    </div>
  );
}
