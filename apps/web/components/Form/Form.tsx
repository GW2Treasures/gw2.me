'use client';

import { FC, ReactNode, useEffect } from 'react';
import { experimental_useFormState as useFormState } from 'react-dom';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { useRouter } from 'next/navigation';

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
  const { refresh } = useRouter();

  useEffect(() => {
    if(state.success) {
      refresh();
    }
  }, [state.success, refresh]);

  return (
    <form action={formAction} id={id}>
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
