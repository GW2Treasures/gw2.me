'use client';

import { Dialog } from '@gw2treasures/ui/components/Dialog/Dialog';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { startAuthentication } from '@simplewebauthn/browser';
import { LoginOptions } from 'app/login/action';
import { unstable_rethrow as rethrow } from 'next/navigation';
import { useCallback, useState, useTransition, type FC } from 'react';
import { NoticeContext, useShowNotice } from '../NoticeContext/NoticeContext';
import { getAuthenticationOptions, submitAuthentication } from './actions';
import { PasskeyAuthenticationDialog } from './PasskeyAuthenticationDialog';
import { useBrowserSupportsWebAuthn } from './use-browser-supports-web-authn';

export interface PasskeyAuthenticationButtonProps {
  className?: string,
  options: LoginOptions,
}

export const PasskeyAuthenticationButton: FC<PasskeyAuthenticationButtonProps> = ({ className, options: loginOptions }) => {
  const supportsPasskeys = useBrowserSupportsWebAuthn();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const notice = useShowNotice();

  const handleClick = useCallback(() => {
    // hide any notice that might still be visible
    notice.show(null);

    // if we know which user is trying to login, start the authentication process
    // otherwise open the dialog to let the user choose if they want to login or register
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
          rethrow(e);
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
