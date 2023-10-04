'use client';

import { FC, ReactNode } from 'react';
import { experimental_useFormState as useFormState } from 'react-dom';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export interface FormState {
  error?: string;
  success?: string;
}

export interface FormProps<State> {
  action: (state: State, payload: FormData) => State | Promise<State>,
  children: ReactNode;
}

export const Form: FC<FormProps<FormState>> = ({ action, children }) => {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction}>
      {state.error && (
        <Notice type="error">{state.error}</Notice>
      )}
      {state.success && (
        <Notice>{state.success}</Notice>
      )}

      {children}
    </form>
  );
};
