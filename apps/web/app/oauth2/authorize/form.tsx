'use client';

/* eslint-disable @next/next/no-img-element */
import { Scope } from '@gw2me/api';
import layoutStyles from './layout.module.css';
import styles from './page.module.css';
import { FC, ReactNode } from 'react';
import { authorize } from './actions';
import { experimental_useFormState as useFormState } from 'react-dom';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export interface AuthorizeFormProps {
  application: {
    id: string;
    name: string;
  };
  scopes: Scope[]
  redirect_uri: string;
  state?: string;

  children: ReactNode;
}

export const AuthorizeForm: FC<AuthorizeFormProps> = ({ application, scopes, redirect_uri, state, children }) => {
  const [formState, action] = useFormState(
    authorize.bind(null, {
      applicationId: application.id,
      redirect_uri,
      scopes,
      state
    }), {}
  );

  return (
    <form action={action} className={styles.form}>
      {formState.error && (
        <Notice type="error">{formState.error}</Notice>
      )}

      {children}
    </form>
  );
};
