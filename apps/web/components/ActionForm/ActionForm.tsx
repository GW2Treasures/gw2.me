import { ServerAction } from '@/lib/action';
import { FC, ReactNode } from 'react';

export interface ActionFormProps {
  action: ServerAction<any>
  children: ReactNode;
}

export const ActionForm: FC<ActionFormProps> = ({ action, children }) => {
  return (
    <form method="POST" action="">
      <input type="hidden" name="$$id" value={action.$$id}/>
      {children}
    </form>
  );
};
