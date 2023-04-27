'use client';

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
    <div>
      Client Secret: {clientSecret ?? '***'}
      {clientSecret === undefined && <button onClick={handleReset}>Reset client_secret</button>}
    </div>
  );
};
