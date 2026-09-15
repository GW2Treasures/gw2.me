'use client';

import { FC, useCallback } from 'react';
import { devLogin } from './dev-login.action';
import { LoginButton } from './button';

export interface DevLoginProps {
  username?: string,
}

export const DevLogin: FC<DevLoginProps> = ({ username }) => {
  const login = useCallback(async () => {
    const name = username ?? prompt('username');

    if(name) {
      await devLogin(name);
      navigator.login?.setStatus('logged-in');
    }
  }, [username]);

  return (
    <LoginButton provider="dev" onClick={login}/>
  );
};
