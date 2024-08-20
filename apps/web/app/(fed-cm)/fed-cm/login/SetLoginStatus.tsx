'use client';

import { useEffect, type FC } from 'react';

export const SetLoginStatus: FC = () => {
  useEffect(() => {
    if('login' in navigator) {
      (navigator.login as { setStatus(status: string): void }).setStatus('logged-in');
    }

    if('IdentityProvider' in window) {
      (window.IdentityProvider as { close(): void }).close();
    }
  });

  return null;
};
