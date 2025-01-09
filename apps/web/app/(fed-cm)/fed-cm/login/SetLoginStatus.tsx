'use client';

import { useEffect, type FC } from 'react';

export const SetLoginStatus: FC = () => {
  useEffect(() => {
    if('login' in navigator) {
      navigator.login.setStatus('logged-in');
    }

    if('IdentityProvider' in window) {
      window.IdentityProvider.close();
    }
  });

  return null;
};
