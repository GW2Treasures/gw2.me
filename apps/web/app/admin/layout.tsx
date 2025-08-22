import { NavLayout } from '@/components/Layout/NavLayout';
import { Navigation } from '@/components/Layout/Navigation';
import { ensureUserIsAdmin } from './admin';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await ensureUserIsAdmin();

  return (
    <NavLayout content={children}>
      <Navigation prefix="/admin/" items={[
        { segment: 'users', icon: 'user', label: 'Users' },
        { segment: 'apps', icon: 'apps', label: 'Apps' },
        { segment: 'authorization-requests', icon: 'gw2me-outline', label: 'Auth Requests' },
        { segment: 'api-keys', icon: 'key', label: 'API Keys' },
        { segment: 'shared-accounts', icon: 'share', label: 'Shared Accounts' },
        { segment: 'requests', icon: 'api-status', label: 'API Requests' },
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
