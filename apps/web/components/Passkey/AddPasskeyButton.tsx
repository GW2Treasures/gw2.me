'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { useCallback, useEffect, useState, useTransition, type FC } from 'react';
import { getRegistrationOptions, submitRegistration } from './actions';

export interface AddPasskeyButtonProps {}

export const AddPasskeyButton: FC<AddPasskeyButtonProps> = ({}) => {
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const handleClick = useCallback(() => startTransition(async () => {
    const { options } = await getRegistrationOptions({ type: 'add' });
    const registration = await startRegistration(options);
    await submitRegistration(registration);
  }), []);

  return (
    <Button icon={pending ? 'loading' : 'passkey'} disabled={!supportsPasskeys || pending} onClick={handleClick}>Add Passkey</Button>
  );
};
