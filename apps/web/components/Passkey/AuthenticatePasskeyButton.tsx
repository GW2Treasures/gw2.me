'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { useCallback, useEffect, useState, useTransition, type FC } from 'react';
import { getAuthenticationOptions, submitAuthentication } from './actions';
import { LoginOptions } from 'app/login/action';
import { Dialog } from '@gw2treasures/ui/components/Dialog/Dialog';
import { DialogActions } from '@gw2treasures/ui/components/Dialog/DialogActions';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';

export interface AuthenticatePasskeyButtonProps {
  className?: string;
  options: LoginOptions;
}

export const AuthenticatePasskeyButton: FC<AuthenticatePasskeyButtonProps> = ({ className, options: loginOptions }) => {
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const handleClick = useCallback(() => startTransition(async () => {
    if(loginOptions.userId) {
      const options = await getAuthenticationOptions();
      const authentication = await startAuthentication(options);
      await submitAuthentication(authentication);
    } else {
      const options = await getAuthenticationOptions();
      setDialogOpen(true);

      // start authentication using "Conditional UI"
      // this promise only resolves when the users clicks on the autocomplete options of the text input
      const authentication = await startAuthentication(options, true);
      await submitAuthentication(authentication);
    }
  }), [loginOptions.userId]);

  return (
    <>
      <Button icon={pending ? 'loading' : 'passkey'} disabled={!supportsPasskeys || pending} onClick={handleClick} className={className}>Login with Passkey</Button>
      <Dialog open={dialogOpen} title="Passkey" onClose={() => setDialogOpen(false)}>
        <Label label="Username">
          <TextInput autoComplete="username webauthn"/>
        </Label>
        <DialogActions>
          <Button>Continue</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
