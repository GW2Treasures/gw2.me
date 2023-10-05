'use client';

import { ActiveButtonClass, NavLayout } from '@/components/Layout/NavLayout';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { useSelectedLayoutSegment } from 'next/navigation';
import { ReactNode } from 'react';

export default function DevLayout({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();

  return (
    <NavLayout content={children}>
      <LinkButton appearance="menu" href="/dev/docs" className={segment === 'docs' ? ActiveButtonClass : undefined}>Documentation</LinkButton>
      <LinkButton appearance="menu" href="/dev/applications" className={segment === 'applications' ? ActiveButtonClass : undefined}>Applications</LinkButton>
    </NavLayout>
  );
}
