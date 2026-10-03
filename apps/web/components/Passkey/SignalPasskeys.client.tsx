'use client';

import { use, useEffect, type FC } from 'react';

export interface SignalPasskeysClientProps {
  rpId: string,
  webAuthnUserId: string,
  userName: string,
  availablePasskeyIds: Promise<string[]>,
}

export const SignalPasskeysClient: FC<SignalPasskeysClientProps> = ({ rpId, webAuthnUserId, userName, availablePasskeyIds }) => {
  const passkeyIds = use(availablePasskeyIds);

  useEffect(() => {
    // check if the browser supports PublicKeyCredential at all
    const supportsPublicKeyCredential = 'PublicKeyCredential' in window;
    if (!supportsPublicKeyCredential) {
      return;
    }

    // signal all existing passkeys
    if ('signalAllAcceptedCredentials' in PublicKeyCredential) {
      PublicKeyCredential.signalAllAcceptedCredentials({
        rpId,
        userId: webAuthnUserId,
        allAcceptedCredentialIds: passkeyIds,
      });
    }

    // signal user name
    if ('signalCurrentUserDetails' in PublicKeyCredential) {
      PublicKeyCredential.signalCurrentUserDetails({
        rpId,
        userId: webAuthnUserId,
        name: userName,
        displayName: ''
      });
    }
  }, [passkeyIds, rpId, userName, webAuthnUserId]);

  return null;
};
