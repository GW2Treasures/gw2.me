'use client';

import { useEffect, type FC } from 'react';

export interface SetLoginStatusProps {}

export const SetLoginStatus: FC<SetLoginStatusProps> = ({}) => {
  useEffect(() => {
    if('login' in navigator) {
      (navigator.login as any).setStatus('logged-in');
    }

    if('IdentityProvider' in window) {
      (window.IdentityProvider as any).close();
    }
  });

  return null;
};
