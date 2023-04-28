import { CommonComponentTest } from '@gw2treasures/ui';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div>
      gw2.me
      <CommonComponentTest/>
    </div>
  );
}

export const metadata = {
  title: 'gw2.me'
};
