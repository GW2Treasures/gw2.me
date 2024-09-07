import { NavLayout } from '@/components/Layout/NavLayout';
import { Navigation } from '@/components/Layout/Navigation';
import { ReactNode } from 'react';
import { ensureUserIsAdmin } from './admin';

export interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await ensureUserIsAdmin();

  return (
    <NavLayout content={children}>
      <Navigation prefix="/admin/" items={[
        { segment: 'users', icon: 'user', label: 'Users' },
        { segment: 'apps', icon: 'developer', label: 'Apps' },
        { segment: 'api-keys', icon: 'key', label: 'API Keys' },
        { segment: 'requests', icon: 'api-status', label: 'Requests' },
        { segment: 'email', icon: 'mail', label: 'Email' },
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
