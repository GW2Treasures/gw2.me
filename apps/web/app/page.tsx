import styles from './page.module.css';
import { Icon, cx } from '@gw2treasures/ui';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import localFont from 'next/font/local';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';

const wotfard = localFont({
  src: [
    { path: '../fonts/wotfard-bold-webfont.woff2', weight: '700' },
  ],
});

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.intro}>
          <div className={styles.title} style={wotfard.style}>Securely manage your<br/>Guild Wars 2 API keys</div>
          {!session && (<Link className={styles.loginButton} href="/login"><Icon icon="user"/> Login</Link>)}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentWidth}>
          <div className={styles.browser}>
            <div className={styles.addressBar}>
              <Icon icon="lock"/> example.com
            </div>
            <div className={styles.browserContent}>
              <div className={styles.sectionHeader}>Connect Applications</div>
              <p>Instead of juggling unwieldy API keys applications can provide a simple <b>Connect with gw2.me</b> button to connect with your your gw2.me profile and all of your Guild Wars 2 Accounts.</p>
              <p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.</p>
              <LinkButton href="/discover" icon="chevron-right" appearance="menu"><span>Discover applications</span></LinkButton>
            </div>
            <div className={styles.authMock}>
              <div className={cx(styles.sectionHeader, styles.authHeader)}>
                <ApplicationImage fileId={null} size={48}/>
                example.com
              </div>
              <hr/>
              <p>example.com wants to access the following data of your gw2.me account.</p>
              <div className={styles.scope}><Icon icon="user"/> Your username</div>
              <div className={styles.scope}>
                <Icon icon="developer"/>
                <div>
                  Read-only access to the Guild Wars 2 API
                  <div>
                    <div className={styles.scopePermission}>account</div>
                    <div className={styles.scopePermission}>inventory</div>
                  </div>
                </div>
              </div>
              <hr/>
              <div>Select Accounts</div>
              <div className={styles.checkbox}><Icon icon="checkmark" className={styles.checkboxBox}/>Main Account (account.1234)<Icon icon="verified"/></div>
              <div className={styles.checkbox}><Icon icon="checkmark" className={styles.checkboxBox}/>another.9876</div>
              <div className={styles.checkbox}><Icon icon="add" className={styles.addAccountCheckbox}/>Add account</div>
              <hr/>
              <div className={styles.authButton}><Icon icon="gw2me-outline"/> Authorize example.com</div>
            </div>
          </div>

          <div className={styles.sectionHeader}>Manage your Guild Wars 2 accounts</div>

          <FlexRow>
            <div className={styles.accountTable}>
              <Table>
                <thead><tr><th>Account</th><th>Verified</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>account.1234</td><td className={styles.verified}><Icon icon="verified"/> Verfied</td><td><Icon icon="status"/> Healthy</td></tr>
                  <tr><td>another.9876</td><td/><td><Icon icon="status"/> Healthy</td></tr>
                  <tr><td colSpan={3} className={styles.addAccountButton}><Icon icon="add"/> Add Account</td></tr>
                </tbody>
              </Table>
            </div>

            <p>Manage all of your Guild Wars 2 Accounts in a single place. Verifiy your ownership of accounts once, and all applications can use this information. Applications will only be able to access the information from Guild Wars 2 that you authorize.</p>
          </FlexRow>

          <div className={styles.sectionHeader}>Review and revoke access at any time</div>
          <p>Keep an overview over which applications are currently authorized to access your Guild Wars 2 accounts. You can also revoke access for each applcation at any time.</p>

          <div className={styles.sectionHeader}>For Developers</div>
          <p>Integrate gw2.me into your apps. It is great!</p>

        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'gw2.me · Securely manage your Guild Wars 2 API keys'
};
