'use client';

import { Notice, NoticeProps } from '@gw2treasures/ui/components/Notice/Notice';
import { FC, ReactNode, createContext, useContext, useState } from 'react';

export interface NoticeContext {
  show: (notice: NoticeProps | null) => void
}

const context = createContext<NoticeContext>({ show: () => {} });

interface NoticeContextProps {
  children: ReactNode;
};

export const NoticeContext: FC<NoticeContextProps> = ({ children }) => {
  const [notice, setNotice] = useState<NoticeProps | null>(null);

  return (
    <context.Provider value={{ show: setNotice }}>
      {notice && <Notice {...notice}/>}
      {children}
    </context.Provider>
  );
};

export function useShowNotice() {
  return useContext(context);
}
