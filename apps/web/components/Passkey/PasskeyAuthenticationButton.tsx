'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { useCallback, useEffect, useState, useTransition, type FC } from 'react';
import { getAuthenticationOptions, submitAuthentication } from './actions';
import { LoginOptions } from 'app/login/action';
import { Dialog } from '@gw2treasures/ui/components/Dialog/Dialog';
import { NoticeContext, useShowNotice } from '../NoticeContext/NoticeContext';
import { PasskeyAuthenticationDialog } from './PasskeyAuthenticationDialog';

export interface PasskeyAuthenticationButtonProps {
  className?: string;
  options: LoginOptions;
}

export const PasskeyAuthenticationButton: FC<PasskeyAuthenticationButtonProps> = ({ className, options: loginOptions }) => {
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const notice = useShowNotice();

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const handleClick = useCallback(() => {
    // hide any notice that might still be visible
    notice.show(null);

    if(loginOptions.userId) {
      startTransition(async () => {
        try {
          // get authentication options from server
          const { options, challenge } = await getAuthenticationOptions();

          // start passkey authentication
          const authentication = await startAuthentication({ optionsJSON: options });

          // submit authentication to server to verify challenge and start session
          await submitAuthentication(challenge, authentication, loginOptions.returnTo);
        } catch(e) {
          console.error(e);
          if(e instanceof Error) {
            if(e.name === 'NotAllowedError') {
              // user has canceled
              notice.show({ type: 'error', children: 'Passkey authentication canceled.' });
              return;
            }
          }

          notice.show({ type: 'error', children: 'Unknown error during passkey authentication.' });
        }
      });
    } else {
      setDialogOpen(true);
    }
  }, [loginOptions.returnTo, loginOptions.userId, notice]);

  return (
    <>
      <Button icon={pending ? 'loading' : 'passkey'} disabled={!supportsPasskeys || pending} onClick={handleClick} className={className}>
        Login with Passkey
      </Button>
      <Dialog open={dialogOpen} title="Passkey" onClose={() => setDialogOpen(false)}>
        <NoticeContext>
          <PasskeyAuthenticationDialog options={loginOptions}/>
        </NoticeContext>
      </Dialog>
    </>
  );
};
