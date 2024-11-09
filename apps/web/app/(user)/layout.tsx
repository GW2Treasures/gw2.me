'use client';

import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { useSelectedLayoutSegment } from 'next/navigation';
import { ActiveButtonClass, NavLayout } from '@/components/Layout/NavLayout';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';
import { LayoutProps } from '@/lib/next';

export default function ProfileLayout({ children }: LayoutProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <NavLayout content={children}>
      <LinkButton appearance="menu" href="/profile" icon="user" className={segment === 'profile' ? ActiveButtonClass : undefined}>Profile</LinkButton>
      <LinkButton appearance="menu" href="/accounts" icon="key" className={segment === 'accounts' ? ActiveButtonClass : undefined}>GW2 Accounts</LinkButton>
      <LinkButton appearance="menu" href="/providers" icon="profession" className={segment === 'providers' ? ActiveButtonClass : undefined}>Login Providers</LinkButton>
      <LinkButton appearance="menu" href="/applications" icon="gw2me-outline" className={segment === 'applications' ? ActiveButtonClass : undefined}>Applications</LinkButton>
      <Separator/>
      <LinkButton appearance="menu" href="/dev/applications" icon="developer">Developer</LinkButton>
    </NavLayout>
  );
}
