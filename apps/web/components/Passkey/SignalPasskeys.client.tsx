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
    if ('signalAllAcceptedCredentials' in PublicKeyCredential) {
      PublicKeyCredential.signalAllAcceptedCredentials({
        rpId,
        userId: webAuthnUserId,
        allAcceptedCredentialIds: passkeyIds,
      });
    }

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
