import { ReactNode } from 'react';
import { Bitter } from 'next/font/google';
import localFont from 'next/font/local';
import { cx } from '@/lib/classNames';

import './global.css';
import './variables.css';
import '@gw2treasures/icons/styles.css';

import styles from './layout.module.css';
import Link from 'next/link';
import { getUser } from '@/lib/getUser';
import { Icon } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';

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
        <div className={styles.viewport}>
          <div className={styles.header}>
            <Icon icon="gw2me" color="var(--color-brand)"/>
            <Link href="/" className={styles.title}>gw2.me</Link>
            <div className={styles.mobileHidden}>by <a href="https://gw2treasures.com/">gw2treasures.com</a></div>
            <LinkButton appearance="menu" href="/discover" className={styles.mobileHidden}>Discover</LinkButton>
            <div className={styles.right}>
              <LinkButton appearance="menu" href={user ? '/profile' : '/login'} icon="user">{user ? user.name : 'Login'}</LinkButton>
            </div>
          </div>
          {children}
          <div className={styles.footer}>
            <div className={styles.copyright}><b>gw2.me</b> by <a href="https://next.gw2treasures.com/">gw2treasures.com</a> © {new Date().getFullYear()}</div>
            <div className={styles.footerLinks}>
              <Link href="/dev/docs">Developer Documentation</Link>
              <Link href="/legal">Legal Notice</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className={styles.disclaimer}>
          <p>This site is not affiliated with ArenaNet, Guild Wars 2, or any of their partners. All copyrights reserved to their respective owners.</p>
          <p>© 2014 ArenaNet, Inc. All rights reserved. NCsoft, the interlocking NC logo, ArenaNet, Guild Wars, Guild Wars Factions, Guild Wars Nightfall, Guild Wars: Eye of the North, Guild Wars 2, and all associated logos and designs are trademarks or registered trademarks of NCsoft Corporation. All other trademarks are the property of their respective owners.</p>
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
  description: 'Securely manage GW2 API access',
};
