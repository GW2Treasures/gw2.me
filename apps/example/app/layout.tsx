import { ReactNode } from 'react';
import { Bitter } from 'next/font/google';
import './global.css';
import './variables.css';
import styles from './layout.module.css';
import Link from 'next/link';
import { Icon } from '@gw2treasures/ui';

interface RootLayoutProps {
  children: ReactNode;
}

const bitter = Bitter({
  subsets: ['latin' as const],
  weight: '700',
  variable: '--font-bitter',
});

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={bitter.variable}>
      <body>
        <Link href="/" className={styles.header}>
          <Icon icon="gw2me-outline"/>
          <div className={styles.title}>Example App</div>
        </Link>
        <div className={styles.content}>
          {children}
        </div>
      </body>
    </html>
  );
}

export const metadata = {
  title: {
    template: '%s · example@gw2.me',
    default: ''
  },
  description: 'Securely manage GW2 API access',
};
