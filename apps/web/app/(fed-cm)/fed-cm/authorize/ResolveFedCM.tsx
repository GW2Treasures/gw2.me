'use client';

import { useEffect, type FC } from 'react';

export interface ResolveFedCMProps {
  code: string | undefined | null,
}

export const ResolveFedCM: FC<ResolveFedCMProps> = ({ code }) => {
  useEffect(() => {
    if('IdentityProvider' in window) {
      if(code) {
        window.IdentityProvider.resolve(code);
      } else {
        window.IdentityProvider.close();
      }
    }
  });

  return null;
};
