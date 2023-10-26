import { NavLayout } from '@/components/Layout/NavLayout';
import { getUser } from '@/lib/getUser';
import { UserRole } from '@gw2me/database';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

export interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getUser();

  if(!user || !user.roles.includes(UserRole.Admin)) {
    notFound();
  }

  return (
    <NavLayout content={children}>
      <LinkButton appearance="menu" href="/admin/users" icon="user">Users</LinkButton>
      <LinkButton appearance="menu" href="/admin/apps" icon="user">Apps</LinkButton>
    </NavLayout>
  );
}
