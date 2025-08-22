import { NavLayout } from '@/components/Layout/NavLayout';
import { Navigation } from '@/components/Layout/Navigation';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';

export default function DevLayout({ children }: LayoutProps<'/dev'>) {
  return (
    <NavLayout content={children}>
      <Navigation prefix="/dev/" items={[
        { segment: ['docs'], label: 'Documentation' },
        { segment: ['docs', 'manage-apps'], label: 'Manage Apps' },
        { segment: ['docs', 'access-tokens'], label: 'Getting Access Tokens' },
        { segment: ['docs', 'refresh-tokens'], label: 'Refreshing Tokens' },
        { segment: ['docs', 'gw2-api'], label: 'Guild Wars 2 API' },
        { segment: ['docs', 'users'], label: 'Users' },
        { segment: ['docs', 'scopes'], label: 'Scopes' },
        { segment: ['docs', 'fed-cm'], label: 'FedCM API' },
        { segment: ['docs', 'best-practices'], label: 'Best Practices' },
        { segment: ['docs', 'branding'], label: 'Branding' },
        { segment: ['docs', 'api-reference'], label: 'API Reference' },
        { segment: ['docs', 'libraries'], label: 'Client Libraries' },
      ]}/>
      <Separator/>
      <Navigation prefix="/dev/" items={[
        { segment: 'applications', icon: 'apps', label: 'Your Applications' },
      ]}/>
    </NavLayout>
  );
}
