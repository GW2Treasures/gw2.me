import styles from './page.module.css';
import { Icon, cx } from '@gw2treasures/ui';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import localFont from 'next/font/local';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { PermissionList } from '@/components/Permissions/PermissionList';

const wotfard = localFont({
  src: [
    { path: '../fonts/wotfard-bold-webfont.woff2', weight: '700' },
  ],
});

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className={styles.page}>
      <div className={styles.borderHide}/>

      <div className={styles.hero}>
        <div className={styles.intro}>
          <div className={styles.title} style={wotfard.style}>Securely Manage your<br/>Guild Wars 2 API Keys</div>
          {!session && (<Link className={styles.loginButton} href="/login"><Icon icon="chevron-right"/> Get Started</Link>)}
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
              <p>Connect your Guild Wars 2 accounts directly to applications. You do not have to create an API key and copy-paste it for every application anymore. If you have multiple accounts, you can simply choose the accounts the application should have access to.</p>
              <p>For all applications with gw2.me integration it is just one click to authorize access to your Guild Wars 2 accounts. You review the requested permissions and authorize them using the secure OAuth 2.0 protocol. The application will only receive the permissions you granted.</p>
              <LinkButton href="/discover" icon="chevron-right" appearance="menu" className={styles.discoverButton}><span>Discover Applications</span></LinkButton>
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
                  <PermissionList permissions={['account', 'inventories']}/>
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

          <div className={styles.accountsSection}>
            <div className={styles.table}>
              <Table>
                <thead><tr><th>Account</th><th>Verified</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>account.1234</td><td className={styles.verified}><Icon icon="verified"/> Verified</td><td className={styles.healthy}><Icon icon="status"/> Healthy</td></tr>
                  <tr><td>another.9876</td><td/><td className={styles.healthy}><Icon icon="status"/> Healthy</td></tr>
                  <tr><td colSpan={3} className={styles.addAccountButton}><Icon icon="add"/> Add Account</td></tr>
                </tbody>
              </Table>
            </div>

            <div>
              <div className={styles.sectionHeader}>Manage your Guild Wars 2 Accounts</div>
              <p>Manage all your Guild Wars 2 Accounts in a single place. Applications will only be able to access the information from the accounts you authorize. You can update the accounts an application has access to at any time.</p>
              <p>You will be guided through the process of adding new accounts to gw2.me. You can also verify your ownership of accounts, and applications will be able to use this information.</p>
              <p>gw2.me will monitor the status of your API keys and inform you when you need to take action.</p>
              <LinkButton href="/accounts" icon="chevron-right" appearance="menu" className={styles.discoverButton}><span>Add your Accounts</span></LinkButton>
            </div>
          </div>


          <div className={styles.accountsSection}>
            <div>
              <div className={styles.sectionHeader}>Share your Guild Wars 2 Accounts</div>
              <p>
                You can share your Guild Wars 2 accounts with your friends. This way, they can use see your accounts in their applications and keep track of your progress, without getting access to your API keys.
                You get full insight into which user currently has access to your accounts, they applications they are using, and you can revoke access at any time.
              </p>
              <LinkButton href="/accounts" icon="chevron-right" appearance="menu" className={styles.discoverButton}><span>Share your Accounts</span></LinkButton>
            </div>
          </div>

          <div className={styles.accountsSection}>
            <div>
              <div className={styles.sectionHeader}>Review and Revoke Access</div>
              <p>Keep an overview over which applications are currently authorized to access your Guild Wars 2 accounts. You can also revoke access for each application at any time.</p>
              <LinkButton href="/applications" icon="chevron-right" appearance="menu" className={styles.discoverButton}><span>Review your Applications</span></LinkButton>
            </div>

            <div className={styles.table}>
              <Table>
                <thead><tr><th>Application</th><Table.HeaderCell small/></tr></thead>
                <tbody>
                  <tr><td><Icon icon="gw2t" className={styles.gw2treasures}/>gw2treasures.com</td><td><Icon icon="delete"/></td></tr>
                  <tr><td><Icon icon="gw2me" className={styles.gw2treasures}/>gw2.me Extensions</td><td><Icon icon="delete"/></td></tr>
                </tbody>
              </Table>
            </div>
          </div>

          <div className={styles.sectionHeader}>For Developers</div>
          <p>If you are a developer, you can integrate gw2.me into your applications. gw2.me will take care of the authorization and Guild Wars 2 account management, so you can focus on developing your application.</p>
          <p>Since gw2.me is an OAuth 2.0 provider, you can use existing libraries to use gw2.me in your application. Or use our extensive developer documentation to call the few API endpoints yourself.</p>
          <LinkButton href="/dev/docs" icon="chevron-right" appearance="menu" className={styles.discoverButton}><span>Check Documentation</span></LinkButton>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'gw2.me · Securely manage your Guild Wars 2 API keys',
};
