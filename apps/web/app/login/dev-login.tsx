'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC, useCallback } from 'react';
import styles from './form.module.css';
import { devLogin } from './dev-login.action';

export interface DevLoginProps {
  username?: string
}

export const DevLogin: FC<DevLoginProps> = ({ username }) => {
  const login = useCallback(() => {
    const name = username ?? prompt('username');

    if(name) {
      devLogin(name);
    }
  }, [username]);

  return (
    <Button className={styles.button} onClick={login} icon="user">Dev Login</Button>
  );
};
