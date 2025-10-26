import { getGw2MeUrl } from '@/lib/client';
import { Icon } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Metadata } from 'next';
import { Bitter } from 'next/font/google';
import Link from 'next/link';
import './global.css';
import styles from './layout.module.css';
import './variables.css';
import { FC, Suspense } from 'react';

const bitter = Bitter({
  subsets: ['latin' as const],
  weight: '700',
  variable: '--font-bitter',
});

export default function RootLayout({ children }: LayoutProps<'/'>) {
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

            <Suspense>
              <ReturnToGw2MeButton/>
            </Suspense>
          </div>
        </div>
        <div className={styles.content}>
          <Suspense fallback={<Icon icon="loading"/>}>
            {children}
          </Suspense>
        </div>
      </body>
    </html>
  );
}

const ReturnToGw2MeButton: FC = async () => (
  <LinkButton appearance="menu" href={await getGw2MeUrl()} external icon="gw2me" className={styles.right}>Return to gw2.me</LinkButton>
);

export const metadata: Metadata = {
  title: {
    template: '%s · gw2.me Demo',
    default: ''
  },
  description: 'Try out gw2.me with this demo application',
};
