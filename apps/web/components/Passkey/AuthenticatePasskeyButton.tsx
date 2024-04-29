'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { useCallback, useEffect, useState, useTransition, type FC } from 'react';
import { getAuthenticationOptions, submitAuthentication, submitRegistration } from './actions';

export interface AuthenticatePasskeyButtonProps {
  className?: string;
}

export const AuthenticatePasskeyButton: FC<AuthenticatePasskeyButtonProps> = ({ className }) => {
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const handleClick = useCallback(() => startTransition(async () => {
    const options = await getAuthenticationOptions();
    const authentication = await startAuthentication(options);
    await submitAuthentication(authentication);
  }), []);

  return (
    <Button icon={pending ? 'loading' : 'passkey'} disabled={!supportsPasskeys || pending} onClick={handleClick} className={className}>Login with Passkey</Button>
  );
};
