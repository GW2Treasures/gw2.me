'use client';

import { AuthenticationMethod } from '@/lib/oauth/types';
import { ClientType } from '@gw2me/database';
import { createContext, use, useState } from 'react';
import styles from './api-reference.module.css';

interface ApiReferenceContext {
  type: ClientType,
  authorization: AuthenticationMethod
}

const defaultContextValue: ApiReferenceContext = {
  type: 'Confidential',
  authorization: AuthenticationMethod.client_secret_basic
};

const context = createContext<ApiReferenceContext>(defaultContextValue);

import type { FC, ReactNode } from 'react';
import { Select } from '@gw2treasures/ui/components/Form/Select';

export interface ApiReferenceProps {
  children: ReactNode
}

export const ApiReference: FC<ApiReferenceProps> = ({ children }) => {
  const [value, setValue] = useState(defaultContextValue);

  return (
    <context.Provider value={value}>
      <div className={styles.toolbar}>
        <label className={styles.label}>
          Client type
          <Select options={[{ value: ClientType.Confidential, label: 'Confidential' }, { value: ClientType.Public, label: 'Public' }]} value={value.type} onChange={(type) => setValue({ ...value, type: type as ClientType })}/>
        </label>
        <label className={styles.label}>
          Authorization method
          <Select options={[{ value: AuthenticationMethod.client_secret_basic, label: 'client_secret_basic' }, { value: AuthenticationMethod.client_secret_post, label: 'client_secret_post' }]}
            value={value.authorization} onChange={(authorization) => setValue({ ...value, authorization: authorization as AuthenticationMethod })}/>
        </label>
      </div>
      <div className={styles.children}>
        {children}
      </div>
    </context.Provider>
  );
};

export function useApiReference() {
  return use(context);
}
