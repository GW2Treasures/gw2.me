import { Bitter } from 'next/font/google';
import localFont from 'next/font/local';

import './global.css';
import './variables.css';

import styles from './layout.module.css';
import Link from 'next/link';
import { getUser } from '@/lib/session';
import { Icon, cx } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { DataTableContext } from '@gw2treasures/ui/components/Table/DataTableContext';

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

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const user = await getUser();

  return (
    <html lang="en" className={cx(bitter.variable, wotfard.variable)}>
      <body>
        <div className={styles.viewport}>
          <div className={styles.header}>
            <Icon icon="gw2me" color="var(--color-brand)"/>
            <Link href="/" className={styles.title}>gw2.me</Link>
            <div className={styles.mobileHidden}>by <a href="https://gw2treasures.com/">gw2treasures.com</a></div>
            <nav>
              <LinkButton appearance="menu" href="/discover" className={styles.mobileHidden}>Discover</LinkButton>
              <LinkButton appearance="menu" href="/extension" className={styles.mobileHidden}>Extension</LinkButton>
            </nav>
            <div className={styles.right}>
              <LinkButton appearance="menu" href={user ? '/profile' : '/login'} icon="user">{user ? user.name : 'Login'}</LinkButton>
            </div>
          </div>
          <hr className={styles.border}/>
          <aside data-nosnippet="true" style={{ padding: 16, background: 'var(--color-brand)', color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>
            The official Guild Wars 2 API is currently experiencing major issues and has been partially disabled.<br/>
            It is currently not possible to add new API keys or verify accounts. Applications using gw2.me might not work properly.
          </aside>
          <DataTableContext>
            {children}
          </DataTableContext>
          <div className={styles.footer}>
            <div className={styles.copyright}><b>gw2.me</b> by <a href="https://gw2treasures.com/">gw2treasures.com</a> © {new Date().getFullYear()}</div>
            <div className={styles.footerLinks}>
              <Link href="/dev/docs">Developer Documentation</Link>
              <Link href="/legal">Legal Notice</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className={styles.disclaimer}>
          <p>This site is not affiliated with ArenaNet, Guild Wars 2, or any of their partners. All copyrights reserved to their respective owners.</p>
          <p>© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of Thorns, Guild Wars 2: Path of Fire, Guild Wars 2: End of Dragons, and Guild Wars 2: Secrets of the Obscure and all associated logos, designs, and composite marks are trademarks or registered trademarks of NCSOFT Corporation.</p>
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
