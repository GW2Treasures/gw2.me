import { NavLayout } from '@/components/Layout/NavLayout';
import { Navigation } from '@/components/Layout/Navigation';
import { LayoutProps } from '@/lib/next';
import { ensureUserIsAdmin } from './admin';

export default async function AdminLayout({ children }: LayoutProps) {
  await ensureUserIsAdmin();

  return (
    <NavLayout content={children}>
      <Navigation prefix="/admin/" items={[
        { segment: 'users', icon: 'user', label: 'Users' },
        { segment: 'apps', icon: 'apps', label: 'Apps' },
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
