'use client';

import { register } from '@gw2me/client/button';
import { useEffect, useRef, type FC } from 'react';

export interface ButtonProps {
  url: string,
  baseUrl: string,

  clientId: string,
  redirectUri: string,
  scopes: string,
}

export const Button: FC<ButtonProps> = ({ url, baseUrl, clientId, redirectUri, scopes }) => {
  const iframe = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    register({ url: baseUrl });
  }, [baseUrl]);

  useEffect(() => {
    const handler = (message: MessageEvent) => {
      if(iframe.current?.contentWindow && message.source === iframe.current.contentWindow) {
        console.log('message from iframe:', message.data, navigator.userActivation.isActive);
        iframe.current.contentWindow.postMessage({ type: 'gw2.me:pkce' }, new URL(url).origin);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [url]);

  return (
    // <iframe src={url} height={36} width={250} style={{ border: 'none', overflow: 'hidden' }} allow="identity-credentials-get" ref={iframe}/>
    // @ts-expect-error custom element
    <gw2me-button client-id={clientId} redirect-uri={redirectUri} scope={scopes}/>
  );
};
