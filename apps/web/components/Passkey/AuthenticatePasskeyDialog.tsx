'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { startAuthentication, startRegistration, browserSupportsWebAuthnAutofill } from '@simplewebauthn/browser';
import { useCallback, useEffect, useRef, useState, useTransition, type FC } from 'react';
import { getAuthenticationOptions, getAuthenticationOrRegistrationOptions, submitAuthentication, submitRegistration } from './actions';
import { DialogActions } from '@gw2treasures/ui/components/Dialog/DialogActions';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { useShowNotice } from '../NoticeContext/NoticeContext';

export interface AuthenticatePasskeyDialogProps {}

const invalidUsernameRegex = /[^a-z0-9._-]/i;

export const AuthenticatePasskeyDialog: FC<AuthenticatePasskeyDialogProps> = ({ }) => {
  const [pending, startTransition] = useTransition();
  const [username, setUsername] = useState('');
  const [authenticationTimeout, startAuthenticationTimeout, stopAuthenticationTimeout] = useTimeout();
  const notice = useShowNotice();

  const initializeConditionalUi = useCallback(async () => {
    const supported = await browserSupportsWebAuthnAutofill();

    if(!supported) {
      console.warn('webauthn conditional UI not supported');
      return;
    }

    console.log('initializing webauthn condition ui');

    try {
      const { options, challenge } = await getAuthenticationOptions();

      if(options.timeout) {
        startAuthenticationTimeout(options.timeout);
      }

      // start authentication using "Conditional UI"
      // this promise only resolves when the users clicks on the autocomplete options of the text input
      const authentication = await startAuthentication(options, true);
      await startTransition(() => submitAuthentication(challenge, authentication));
    } catch(e) {
      console.error(e);

      if(e instanceof Error && e.name === 'AbortError') {
        // silently ignore abort errors, these are 99% because we started a different authorization request,
        // either by restarting the conditional ui (especially in dev with react strict mode) or by submiting the form
        return;
      }

      notice.show({ type: 'error', children: 'Unknown error during passkey authentication' });
    }
  }, [notice, startAuthenticationTimeout]);

  // form submit handler
  const handleAuthenticateOrRegister = useCallback(() => startTransition(async () => {
    // hide any error messages that are currently shown
    notice.show(null);

    // stop timout timer for conditional ui
    stopAuthenticationTimeout();

    try {
      const authenticationOnRegistration = await getAuthenticationOrRegistrationOptions(username);

      if(authenticationOnRegistration.type === 'authentication') {
        const authentication = await startAuthentication(authenticationOnRegistration.options);
        await submitAuthentication(authenticationOnRegistration.challenge, authentication);
      } else {
        const registration = await startRegistration(authenticationOnRegistration.options);
        await submitRegistration({ type: 'new', username }, authenticationOnRegistration.challenge, registration);
      }
    } catch(e) {
      console.error(e);

      // restart conditional ui
      initializeConditionalUi();

      // check if user has canceled
      if(e instanceof Error && e.name === 'NotAllowedError') {
        notice.show({ type: 'error', children: 'Passkey authentication canceled.' });
        return;
      }

      // show error
      notice.show({ type: 'error', children: 'Unknown error during passkey authentication.' });

      // restart conditional ui
      initializeConditionalUi();
    }
  }), [notice, stopAuthenticationTimeout, username, initializeConditionalUi]);

  // init conditional ui on mount
  useEffect(() => {
    initializeConditionalUi();
  }, [initializeConditionalUi]);

  // hide errors when timeout is exceeded
  useEffect(() => {
    notice.show(null);
  }, [authenticationTimeout, notice]);

  const isInvalidUsername = invalidUsernameRegex.test(username);

  if(authenticationTimeout) {
    return (
      <>
        <p>Passkey authentication challenge has expired.</p>
        <DialogActions>
          <Button onClick={() => initializeConditionalUi()} icon="revision">Restart</Button>
        </DialogActions>
      </>
    );
  }

  return (
    <>
      <p style={{ maxWidth: 500 }}>
        Passkeys enable you to securely sign in to your gw2.me account using your fingerprint, face, screen lock, or hardware security key.
      </p>
      <p>
        Enter the username of the account you want to create or sign in to.
      </p>
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
