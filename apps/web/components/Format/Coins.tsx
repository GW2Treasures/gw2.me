import type { FC } from 'react';
import styles from './Coins.module.css';

interface CoinsProps {
  value: number;
  showZero?: boolean;
}

export const Coins: FC<CoinsProps> = ({ value, showZero = false }) => {
  const gold = Math.floor(value / 10000);
  const silver = Math.floor((value % 10000) / 100);
  const copper = value % 100;

  return (
    <span className={styles.coins}>
      {(gold > 0 || showZero) && <span className={styles.g}>{gold}</span>}
      {(silver > 0 || showZero) && <span className={styles.s}>{silver}</span>}
      {(copper > 0 || value === 0 || showZero) && <span className={styles.c}>{copper}</span>}
    </span>
  );
};
