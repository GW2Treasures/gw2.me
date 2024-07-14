'use client';

import { Gw2MeClient } from '@gw2me/client';
import { useEffect, type FC } from 'react';

export interface FedCmProps {
  gw2meUrl: string;
}

export const FedCm: FC<FedCmProps> = ({ gw2meUrl }) => {
  useEffect(() => {
    const abortController = new AbortController();
    const gw2me = new Gw2MeClient({ client_id: 'example_client_id' }, { url: gw2meUrl });

    if(!gw2me.fedCM.isSupported()) {
      return;
    }

    gw2me.fedCM.request({ signal: abortController.signal })
      .then((credentials) => console.log({ credentials }))
      .catch(() => {});

    return () => abortController.abort();
  });

  return null;
};
