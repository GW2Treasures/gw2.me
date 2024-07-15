'use client';

import { Gw2MeClient } from '@gw2me/client';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FC } from 'react';

export interface FedCmProps {
  gw2meUrl: string;
}

export const FedCm: FC<FedCmProps> = ({ gw2meUrl }) => {
  const router = useRouter();
  const [supportsFedCmMode, setSupportsFedCmMode] = useState(false);

  useEffect(() => {
    let supportsFedCmMode = false;
    try {
      navigator.credentials.get({
        identity: Object.defineProperty(
          {}, 'mode', {
            get () { supportsFedCmMode = true; }
          }
        )
      } as any).catch(() => {});
    } catch(e) {}

    setSupportsFedCmMode(supportsFedCmMode);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const gw2me = new Gw2MeClient({ client_id: 'example_client_id' }, { url: gw2meUrl });

    if(!gw2me.fedCM.isSupported()) {
      return;
    }

    gw2me.fedCM.request({ signal: abortController.signal })
      .catch(() => {})
      .then((credential) => {
        if(credential) {
          router.push(`/callback?code=${credential.token}`);
        }
      });

    return () => abortController.abort();
  });

  const handleFedCMButtonClick = useCallback(() => {
    const gw2me = new Gw2MeClient({ client_id: 'example_client_id' }, { url: gw2meUrl });
    gw2me.fedCM.request({ mode: 'button' }).then((credential) => {
      if(credential) {
        router.push(`/callback?code=${credential.token}`);
      }
    });
  }, [gw2meUrl, router]);

  return supportsFedCmMode ? (
    <Button onClick={handleFedCMButtonClick} icon="gw2me">Login with gw2.me (FedCM)</Button>
  ) : null;
};

