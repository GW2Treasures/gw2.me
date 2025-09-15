'use client';

import { Gw2MeClient } from '@gw2me/client';
import { type FC, useEffect, useMemo } from 'react';

export interface ClientProps {
  clientId: string,
  gw2meUrl: string,
  accessToken?: string,
}

export const Client: FC<ClientProps> = ({ clientId, gw2meUrl, accessToken }) => {
  const gw2me = useMemo(() => new Gw2MeClient({ client_id: clientId }, { url: gw2meUrl }), [clientId, gw2meUrl]);

  useEffect(() => {
    // @ts-expect-error global
    window.gw2me = gw2me;

    // @ts-expect-error global
    window.gw2meApi = accessToken ? gw2me.api(accessToken) : undefined;
  });

  return null;
};
