'use client';

import { FC, ReactNode, useCallback } from 'react';
import { experimental_useFormState as useFormState } from 'react-dom';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export interface FormState {
  error?: string;
  success?: string;
}

export interface FormProps<State> {
  action: (state: State, payload: FormData) => State | Promise<State>,
  children: ReactNode;
  id?: string;
}

export const Form: FC<FormProps<FormState>> = ({ action, children, id }) => {
  const [state, formAction] = useFormState(action, {});

  const showNotice = useCallback((notice: HTMLElement | null) => {
    notice?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (
    <form action={formAction} id={id}>
      {state.error && (
        <Notice type="error" ref={showNotice} key={crypto.randomUUID()}>{state.error}</Notice>
      )}
      {state.success && (
        <Notice ref={showNotice} key={crypto.randomUUID()}>{state.success}</Notice>
      )}

      {children}
    </form>
  );
};
