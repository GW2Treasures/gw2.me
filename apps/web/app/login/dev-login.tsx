'use client';
import { useRouter } from 'next/navigation';
import { FC, useCallback } from 'react';

export interface DevLoginProps {}

export const DevLogin: FC<DevLoginProps> = ({ }) => {
  const { push } = useRouter();
  const login = useCallback(() => {
    const name = prompt('username');

    if(name) {
      push(`/login/dev?name=${encodeURIComponent(name)}`);
    }
  }, [push]);

  return (
    <button type="button" onClick={login}>Dev Login</button>
  );
};
