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
import { useShowNotice } from '../NoticeContext/NoticeContext';

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
  const notice = useShowNotice();

  useEffect(() => {
    setSupportsPasskeys(browserSupportsWebAuthn());
  }, []);

  const handleClick = useCallback(() => startTransition(async () => {
    // hide any notice that might still be visible
    notice.show(null);

    if(loginOptions.userId) {
      try {
        // get authentication options from server
        const { options, challenge } = await getAuthenticationOptions();

        // start passkey authentication
        const authentication = await startAuthentication(options);

        // submit authentication to server to verify challenge and start session
        await submitAuthentication(challenge, authentication);
      } catch(e) {
        console.error(e);
        if(e instanceof Error) {
          if(e.name === 'NotAllowedError') {
            // user has canceled
            notice.show({ type: 'error', children: 'Passkey authentication canceled.' });
            return;
          }
        }

        notice.show({ type: 'error', icon: 'warning', children: 'Unknown error during passkey authentication.' });
      }
    } else {
      setDialogOpen(true);
    }
  }), [loginOptions.userId, notice]);

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
      <Button icon={pending ? 'loading' : 'passkey'} disabled={!supportsPasskeys || pending} onClick={handleClick} className={className}>
        Login with Passkey
      </Button>
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
