import styles from './page.module.css';
import HeroImage from './gw2me_hero.svg?svgr';

export default function HomePage() {
  return (
    <div className={styles.hero}>
      <div>
        <div className={styles.title}>gw2.me</div>
        <div className={styles.sub}>Securly manage your Guild Wars 2 API keys</div>
      </div>
      <div className={styles.image}>
        <HeroImage/>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'gw2.me'
};
