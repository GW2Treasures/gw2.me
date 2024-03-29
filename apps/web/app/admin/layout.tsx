import { NavLayout } from '@/components/Layout/NavLayout';
import { Navigation } from '@/components/Layout/Navigation';
import { getUser } from '@/lib/session';
import { UserRole } from '@gw2me/database';
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
      <Navigation prefix="/admin/" items={[
        { segment: 'users', icon: 'user', label: 'Users' },
        { segment: 'apps', icon: 'developer', label: 'Apps' },
        { segment: 'api-keys', icon: 'key', label: 'API Keys' },
        { segment: 'requests', icon: 'api-status', label: 'Requests' },
      ]}/>
    </NavLayout>
  );
}

export const metadata = {
  title: {
    template: 'Admin: %s',
    default: ''
  }
};
