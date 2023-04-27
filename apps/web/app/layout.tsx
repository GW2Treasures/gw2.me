import { ReactNode } from 'react';
import { Bitter } from 'next/font/google';
import localFont from 'next/font/local';
import { cx } from '@/lib/classNames';
import './global.css';
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

const wotfard = localFont({
  src: [
    { path: '../fonts/wotfard-regular-webfont.woff2', weight: '400' },
    { path: '../fonts/wotfard-medium-webfont.woff2', weight: '500' },
  ],
  variable: '--font-wotfard',
});

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cx(bitter.variable, wotfard.variable)}>
      <body>
        <div className={styles.header}>
          <Image src={icon} alt=""/>
          <div className={styles.title}>gw2.me</div>
          <div>by <a href="https://gw2treasures.com/">gw2treasures.com</a></div>
          <div className={styles.right}>
            <Link href="/login">Login</Link>
          </div>
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
    template: '%s · gw2.me',
    default: ''
  },
  description: 'Securly manage GW2 API access',
};
