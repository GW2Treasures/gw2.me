import styles from './page.module.css';
import { HeroImage } from './gw2me_hero.svg';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Icon } from '@gw2treasures/ui';
import { getUser } from '@/lib/getUser';
import Link from 'next/link';

export default async function HomePage() {
  const user = await getUser();

  return (
    <div>
      <div className={styles.hero}>
        <div>
          <div className={styles.title}>gw2.me</div>
          <div className={styles.sub}>Securely manage your Guild Wars 2 API keys</div>
          <div className={styles.gw2treasures}>A service provided by <a href="https://gw2treasures.com/">gw2treasures.com</a></div>
          {!user && (<Link className={styles.loginButton} href="/login"><Icon icon="user"/> Login</Link>)}
        </div>
        <div className={styles.image}>
          <HeroImage/>
        </div>
      </div>

      <Headline id="how">How it works</Headline>
      <ol className={styles.how}>
        <li>Create a gw2.me account<Link href="/login">Login</Link></li>
        <li>Add API keys for all your Guild Wars 2 accounts</li>
        <li>Login to your favourite applications with gw2.me<Link href="/discover">Discover</Link></li>
        <li>Review and revoke access at any time</li>
      </ol>

      <Headline id="devs">For developers</Headline>
      <p>gw2.me is a OAuth2 Server. You can use your own libraries or frameworks to add gw2.me as a Login Provider. After you have an access token, we provide API endpoints to generate GW2 API subtokens you can use to access the Guild Wars 2 API.</p>
    </div>
  );
}

export const metadata = {
  title: 'gw2.me'
};
