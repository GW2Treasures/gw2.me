import { Bitter } from 'next/font/google';
import './global.css';
import './variables.css';
import styles from './layout.module.css';
import Link from 'next/link';
import { Icon } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { getGw2MeUrl } from '@/lib/client';
import { LayoutProps } from '@/lib/next';

const bitter = Bitter({
  subsets: ['latin' as const],
  weight: '700',
  variable: '--font-bitter',
});

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" className={bitter.variable}>
      <head>
        <meta httpEquiv="origin-trial" content="AqIdXXdSth39NobxjPyrc6vcnnc5WEGmxpT2m5Y4b6GbjMIp+QCMxDrUk16wBGzPTVAGTmc1LXVmIiZr8Od3CwoAAABUeyJvcmlnaW4iOiJodHRwczovL2RlbW8uZ3cyLm1lOjQ0MyIsImZlYXR1cmUiOiJGZWRDbUJ1dHRvbk1vZGUiLCJleHBpcnkiOjE3MzY4MTI4MDB9"/>
      </head>
      <body>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/" className={styles.title}>
              <Icon icon="gw2me-outline"/>
              gw2.me Demo
            </Link>
            <LinkButton appearance="menu" href="/fed-cm">FedCM</LinkButton>
            <LinkButton appearance="menu" href="/button">Button</LinkButton>

            <LinkButton appearance="menu" href={getGw2MeUrl()} external icon="gw2me" className={styles.right}>Return to gw2.me</LinkButton>
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
    template: '%s · gw2.me Demo',
    default: ''
  },
  description: 'Try out gw2.me with this demo application',
};
