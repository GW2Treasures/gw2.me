'use client';

import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { useCallback, useState, type FC } from 'react';
import { getAuthenticationOptions, submitAuthentication } from '../Passkey/actions';
import { handleAuthenticationResult } from '../Passkey/utils';
import { useRouter } from 'next/navigation';
import { browserSupportsWebAuthn, bufferToBase64URLString, base64URLStringToBuffer, AuthenticationCredential } from '@simplewebauthn/browser';

export const LoginButton: FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!browserSupportsWebAuthn()) {
      return;
    }

    e.preventDefault();
    setLoading(true);

    try {
      // generate challenge
      const { options, challenge } = await getAuthenticationOptions();

      console.log({ options, challenge });

      const credential = await navigator.credentials.get({
        publicKey: {
          rpId: options.rpId,
          challenge: base64URLStringToBuffer(options.challenge),
          extensions: options.extensions,
          userVerification: options.userVerification,
          timeout: options.timeout
        },
        // @ts-expect-error: `uiMode` is not yet supported in TypeScript
        uiMode: 'immediate'
      }) as AuthenticationCredential;

      if (!credential) {
        throw new Error('No credential returned from navigator.credentials.get()');
      }

      const result = await submitAuthentication(challenge, {
        id: credential.id,
        rawId: bufferToBase64URLString(credential.rawId),
        response: {
          authenticatorData: bufferToBase64URLString(credential.response.authenticatorData),
          clientDataJSON: bufferToBase64URLString(credential.response.clientDataJSON),
          signature: bufferToBase64URLString(credential.response.signature),
          userHandle: credential.response.userHandle ? bufferToBase64URLString(credential.response.userHandle) : undefined
        },
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults(),
        authenticatorAttachment: ['cross-platform', 'platform'].includes(credential.authenticatorAttachment!) ? credential.authenticatorAttachment as 'cross-platform' | 'platform' : undefined
      });

      console.log(result);

      await handleAuthenticationResult(result);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <LinkButton appearance="menu" href="/login" icon={loading ? 'loading' : 'user'} onClick={handleClick}>Login</LinkButton>
  );
};
