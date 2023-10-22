import styles from './page.module.css';
import { Icon, cx } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export default function ExtensionPage() {
  return (
    <div className={styles.layout}>
      <main className={styles.left}>
        <div className={styles.title} id="extension">Browser Extension</div>
        <p>Get the gw2.me browser extension to generate Subtokens on the fly for tools that do not have gw2.me integration.</p>
        <div className={styles.extensionLinks}>
          <LinkButton external appearance="menu" icon="chevron-right" href="#">Get for Google Chrome - soon&trade;</LinkButton>
          <LinkButton external appearance="menu" icon="chevron-right" href="#">Get for Microsoft Edge - soon&trade;</LinkButton>
          <LinkButton external appearance="menu" icon="chevron-right" target="_blank" href="https://addons.mozilla.org/firefox/addon/gw2-me/">Get for Mozilla Firefox</LinkButton>
        </div>
      </main>
      <aside className={styles.right} aria-hidden>
        <div className={styles.browser}>
          <div className={styles.cursor}/>
          <div className={styles.addressBar}>
            <Icon icon="lock"/> example.com
          </div>
          <div className={styles.extension}>
            <Icon icon="gw2me" color="#b7000d"/>
            <div className={styles.popup}>
              <div className={styles.account}>account.1234<div className={styles.copyAnimated}><Icon icon="copy"/><Icon icon="checkmark"/></div></div>
              <div className={styles.account}>example.9876<div className={styles.copy}><Icon icon="copy"/></div></div>
            </div>
          </div>
          <div className={styles.example}>
            <div className={styles.exampleTitle}>Example Tool</div>
            <div className={styles.exampleDescription}>Enter your API key to use this tool.</div>
            <div className={styles.exampleInput}><span className={styles.exampleInputContent}>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJreDRIWmhNMjQtZkhvVXIwbHZlZGxWVnRIWUIxQzh1emhlUjROOElSM2NjIiwiaWF0IjoxNTU4NTk3OTkxLCJleHAiOjE1NTg1OTg0MDAsInBlcm1pc3Npb25zIjpbImFjY291bnQiXX0._Ya5wUDuhTUdxunay01vs1BXOIvd_U3m94RzHAex8cU</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export const metadata = {
  title: 'Browser Extension',
  description: 'Get the gw2.me browser extension',
};
