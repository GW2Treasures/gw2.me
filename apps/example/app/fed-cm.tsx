'use client';

import { useEffect, type FC, type ReactNode } from 'react';

export interface FedCmProps {
  gw2meUrl: string;
}

export const FedCm: FC<FedCmProps> = ({ gw2meUrl }) => {
  useEffect(() => {
    const request = {
      identity: {
        providers: [{
          configURL: new URL('/fed-cm/config.json', gw2meUrl).toString(),
          clientId: '1e3d49dd-bbda-4780-a51a-e24db5d87826',
          nonce: 'nonce$123'
        }]
      }
    };

    console.log({ request });

    navigator.credentials.get(request as any).then((credentials) => console.log({ credentials }));
  });

  return null;
};
