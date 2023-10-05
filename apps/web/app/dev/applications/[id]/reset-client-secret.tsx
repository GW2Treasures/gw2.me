'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { FC, useCallback, useState } from 'react';

export interface ResetClientSecretProps {
  applicationId: string;
  hasClientSecret: boolean;
  reset: (applicationId: string) => Promise<string>
}

export const ResetClientSecret: FC<ResetClientSecretProps> = ({ applicationId, hasClientSecret, reset }) => {
  const [clientSecret, setClientSecret] = useState<string>();

  const handleReset = useCallback(async () => {
    const clientSecret = await reset(applicationId);
    setClientSecret(clientSecret);
  }, [applicationId, reset]);

  return (
    <>
      <TextInput value={clientSecret ?? (hasClientSecret ? '***' : '')} readOnly/>
      {!clientSecret
        ? <Button onClick={handleReset}>{hasClientSecret ? 'Reset client_secret' : 'Generate Client Secret'}</Button>
        : <CopyButton copy={clientSecret} icon="copy">Copy</CopyButton>}
    </>
  );
};
