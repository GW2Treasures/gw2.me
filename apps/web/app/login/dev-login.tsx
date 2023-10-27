'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC, useCallback } from 'react';
import styles from './form.module.css';
import { devLogin } from './dev-login.action';

export interface DevLoginProps {}

export const DevLogin: FC<DevLoginProps> = ({ }) => {
  const login = useCallback(() => {
    const name = prompt('username');

    if(name) {
      devLogin(name);
    }
  }, []);

  return (
    <Button className={styles.button} onClick={login}>Dev Login</Button>
  );
};
