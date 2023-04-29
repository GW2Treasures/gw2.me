'use client';

import { Button } from '@gw2treasures/ui/components/Form/Button';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { FC, useCallback, useState } from 'react';

export interface ResetClientSecretProps {
  applicationId: string;
  reset: (applicationId: string) => Promise<string>
}

export const ResetClientSecret: FC<ResetClientSecretProps> = ({ applicationId, reset }) => {
  const [clientSecret, setClientSecret] = useState<string>();

  const handleReset = useCallback(async () => {
    const clientSecret = await reset(applicationId);
    setClientSecret(clientSecret);
  }, [applicationId, reset]);

  return (
    <div style={{ gap: 16, display: 'flex' }}>
      <TextInput value={clientSecret ?? '***'} readOnly/>
      {!clientSecret
        ? <Button onClick={handleReset}>Reset client_secret</Button>
        : <CopyButton copy={clientSecret}>Copy</CopyButton>}
    </div>
  );
};
