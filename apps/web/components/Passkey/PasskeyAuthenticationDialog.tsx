'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { startAuthentication, startRegistration, browserSupportsWebAuthnAutofill, WebAuthnAbortService } from '@simplewebauthn/browser';
import { useCallback, useEffect, useRef, useState, useTransition, type FC } from 'react';
import { getAuthenticationOptions, getRegistrationOptions, submitAuthentication, submitRegistration } from './actions';
import { DialogActions } from '@gw2treasures/ui/components/Dialog/DialogActions';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { useShowNotice } from '../NoticeContext/NoticeContext';
import { ButtonLink } from '../ButtonLink/ButtonLink';

const invalidUsernameRegex = /[^a-z0-9._-]/i;

export const PasskeyAuthenticationDialog: FC = () => {
  const [pending, startTransition] = useTransition();
  const [isRegistration, setIsRegistration] = useState(false);
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
        // either by restarting the conditional ui (especially in dev with react strict mode) or by submitting the form
        return;
      }

      notice.show({ type: 'error', children: 'Unknown error during passkey authentication' });
    }
  }, [notice, startAuthenticationTimeout]);

  // authentication submit handler
  const handleAuthenticate = useCallback(() => startTransition(async () => {
    // hide any error messages that are currently shown
    notice.show(null);

    try {
      const authenticationOnRegistration = await getAuthenticationOptions();
      const authentication = await startAuthentication(authenticationOnRegistration.options);
      await submitAuthentication(authenticationOnRegistration.challenge, authentication);
    } catch(e) {
      console.error(e);

      // check if user has canceled
      if(e instanceof Error && e.name === 'NotAllowedError') {
        notice.show({ type: 'error', children: 'Passkey authentication canceled.' });
        return;
      }

      // show error
      notice.show({ type: 'error', children: 'Unknown error during passkey authentication.' });
    }
  }), [notice]);

  // registration submit handler
  const handleRegister = useCallback(() => startTransition(async () => {
    // hide any error messages that are currently shown
    notice.show(null);

    // stop timeout timer for conditional ui
    stopAuthenticationTimeout();

    try {
      const authenticationOnRegistration = await getRegistrationOptions({ type: 'new', username });
      const registration = await startRegistration(authenticationOnRegistration.options);
      await submitRegistration({ type: 'new', username }, authenticationOnRegistration.challenge, registration);
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
    }
  }), [notice, stopAuthenticationTimeout, username, initializeConditionalUi]);

  // init conditional on registration page
  useEffect(() => {
    if(isRegistration) {
      initializeConditionalUi();

      return () => {
        WebAuthnAbortService.cancelCeremony();
        stopAuthenticationTimeout();
      };
    }
  }, [initializeConditionalUi, isRegistration, stopAuthenticationTimeout]);

  // hide errors when toggling between signin/registration or when timeout is exceeded
  useEffect(() => {
    notice.show(null);
  }, [authenticationTimeout, isRegistration, notice]);

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
      {isRegistration ? (
        <>
          <Label label="Username">
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <TextInput value={username} onChange={setUsername} readOnly={pending} autoComplete="username webauthn"/>
              {isInvalidUsername && <div style={{ marginTop: 8, color: 'var(--color-error)' }}>Invalid username</div>}
            </div>
          </Label>
          <DialogActions description={<>Already have an account? <ButtonLink onClick={() => setIsRegistration(false)}>Sign In</ButtonLink></>}>
            <Button onClick={handleRegister} disabled={pending || username.length < 2 || isInvalidUsername} icon={pending ? 'loading' : 'passkey'}>Register</Button>
          </DialogActions>
        </>
      ) : (
        <DialogActions description={<>Don&apos;t have an account? <ButtonLink onClick={() => setIsRegistration(true)}>Register Now</ButtonLink></>}>
          <Button onClick={handleAuthenticate} disabled={pending} icon={pending ? 'loading' : 'passkey'}>Sign In</Button>
        </DialogActions>
      )}
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
