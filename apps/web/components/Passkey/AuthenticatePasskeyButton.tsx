'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useCallback, useEffect, useRef, useState, useTransition, type FC } from 'react';
import { getAuthenticationOptions, getAuthenticationOrRegistrationOptions, submitAuthentication, submitRegistration } from './actions';
import { LoginOptions } from 'app/login/action';
import { Dialog } from '@gw2treasures/ui/components/Dialog/Dialog';
import { DialogActions } from '@gw2treasures/ui/components/Dialog/DialogActions';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';

export interface AuthenticatePasskeyButtonProps {
  className?: string;
  options: LoginOptions;
}

const invalidUsernameRegex = /[^a-z0-9._-]/i;

export const AuthenticatePasskeyButton: FC<AuthenticatePasskeyButtonProps> = ({ className, options: loginOptions }) => {
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [authenticationTimeout, startAuthenticationTimeout, clearAuthenticationTimeout] = useTimeout();

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const handleClick = useCallback(() => startTransition(async () => {
    if(loginOptions.userId) {
      const { options, challenge } = await getAuthenticationOptions();
      const authentication = await startAuthentication(options);
      await submitAuthentication(challenge, authentication);
    } else {
      setDialogOpen(true);
    }
  }), [loginOptions.userId]);

  const handleAuthenticateOrRegister = useCallback(() => startTransition(async () => {
    const authenticationOnRegistration = await getAuthenticationOrRegistrationOptions(username);

    if(authenticationOnRegistration.type === 'authentication') {
      const authentication = await startAuthentication(authenticationOnRegistration.options);
      await submitAuthentication(authenticationOnRegistration.challenge, authentication);
    } else {
      const registration = await startRegistration(authenticationOnRegistration.options);
      await submitRegistration({ type: 'new', username }, authenticationOnRegistration.challenge, registration);
    }
  }), [username]);

  const initializeConditionalUi = useCallback(async () => {
    const { options, challenge } = await getAuthenticationOptions();

    if(options.timeout) {
      startAuthenticationTimeout(options.timeout);
    }

    // start authentication using "Conditional UI"
    // this promise only resolves when the users clicks on the autocomplete options of the text input
    const authentication = await startAuthentication(options, true);
    await startTransition(() => submitAuthentication(challenge, authentication));
  }, [startAuthenticationTimeout]);

  useEffect(() => {
    if(dialogOpen) {
      initializeConditionalUi();
    } else {
      clearAuthenticationTimeout();
    }
  }, [clearAuthenticationTimeout, dialogOpen, initializeConditionalUi]);

  const isInvalidUsername = invalidUsernameRegex.test(username);

  return (
    <>
      <Button icon={pending ? 'loading' : 'passkey'} disabled={!supportsPasskeys || pending} onClick={handleClick} className={className}>Login with Passkey</Button>
      <Dialog open={dialogOpen} title="Passkey" onClose={() => setDialogOpen(false)}>
        {!authenticationTimeout ? (
          <>
            <Label label="Username">
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <TextInput value={username} onChange={setUsername} readOnly={pending} autoComplete="username webauthn"/>
                {isInvalidUsername && <div style={{ marginTop: 8, color: 'var(--color-error)' }}>Invalid username</div>}
              </div>
            </Label>
            <DialogActions>
              <Button onClick={handleAuthenticateOrRegister} disabled={pending || isInvalidUsername || !username} icon={pending ? 'loading' : 'passkey'}>Continue</Button>
            </DialogActions>
          </>
        ) : (
          <>
            <p>Passkey authentication challenge has expired.</p>
            <DialogActions>
              <Button onClick={() => initializeConditionalUi()} icon="revision">Restart</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

function useTimeout() {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const ref = useRef<NodeJS.Timeout>();

  const stopTimeout = useCallback(() => {
    setIsTimedOut(false);

    if(ref.current) {
      clearTimeout(ref.current);
    }
  }, []);

  const startTimeout = useCallback((ms: number) => {
    stopTimeout();
    ref.current = setTimeout(() => setIsTimedOut(true), ms);
  }, [stopTimeout]);

  // clear timeout on unmount
  useEffect(() => () => {
    if(ref.current) {
      clearTimeout(ref.current);
    }
  }, []);

  return [isTimedOut, startTimeout, stopTimeout] as const;
}
