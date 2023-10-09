import { ReactNode } from 'react';
import { Bitter } from 'next/font/google';
import './global.css';
import './variables.css';
import styles from './layout.module.css';
import icon from './icon.svg';
import Image from 'next/image';
import Link from 'next/link';

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
        <div className={styles.header}>
          <Image src={icon} alt=""/>
          <Link href="/" className={styles.title}>Example App</Link>
        </div>
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
