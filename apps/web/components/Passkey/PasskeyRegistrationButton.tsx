'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { useCallback, useEffect, useState, useTransition, type FC } from 'react';
import { getRegistrationOptions, submitRegistration } from './actions';
import { useShowNotice } from '../NoticeContext/NoticeContext';

export interface PasskeyRegistrationButtonProps {}

export const PasskeyRegistrationButton: FC<PasskeyRegistrationButtonProps> = ({}) => {
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);
  const [pending, startTransition] = useTransition();
  const notice = useShowNotice();

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const handleClick = useCallback(() => startTransition(async () => {
    // hide any notice that might still be visible
    notice.show(null);

    try {
      // get registration options from server
      const { options, challenge } = await getRegistrationOptions({ type: 'add' });

      // start passkey registration
      const registration = await startRegistration(options);

      // submit registration to server to verify challenge and store passkey
      await submitRegistration({ type: 'add' }, challenge, registration);
    } catch (e) {
      console.error(e);
      if(e instanceof Error) {
        if(e.name === 'InvalidStateError') {
          // don't show any error, local device is already registered
          return;
        } else if(e.name === 'NotAllowedError') {
          // user has canceled
          notice.show({ type: 'error', children: 'Passkey registration canceled.' });

          return;
        }
      }

      notice.show({ type: 'error', icon: 'warning', children: 'Unknown error during passkey registration.' });
    }
  }), [notice]);

  return (
    <Button icon={pending ? 'loading' : 'passkey'} disabled={!supportsPasskeys || pending} onClick={handleClick}>Add Passkey</Button>
  );
};
