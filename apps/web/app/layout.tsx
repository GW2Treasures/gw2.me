import { ReactNode } from 'react';
import { Bitter } from 'next/font/google';
import localFont from 'next/font/local';
import { cx } from '@/lib/classNames';
import './global.css';
import './variables.css';
import styles from './layout.module.css';
import GW2MeIcon from './icon.svg?svgr';
import Link from 'next/link';
import { getUser } from '@/lib/getUser';
import { Icon } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

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

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: RootLayoutProps) {
  const user = await getUser();

  return (
    <html lang="en" className={cx(bitter.variable, wotfard.variable)}>
      <body>
        <div className={styles.header}>
          <Icon icon={<GW2MeIcon/>}/>
          <Link href="/" className={styles.title}>gw2.me</Link>
          <div>by <a href="https://gw2treasures.com/">gw2treasures.com</a></div>
          <div className={styles.right}>
            <LinkButton appearance="menu" href={user ? '/profile' : '/login'} icon="user">{user ? user.name : 'Login'}</LinkButton>
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
