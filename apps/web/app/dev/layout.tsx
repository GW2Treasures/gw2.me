import { NavLayout } from '@/components/Layout/NavLayout';
import { Navigation } from '@/components/Layout/Navigation';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';
import { ReactNode } from 'react';

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <NavLayout content={children}>
      <Navigation prefix="/dev/" items={[
        { segment: ['docs'], label: 'Documentation' },
        { segment: ['docs', 'register-app'], label: 'Register your App' },
        { segment: ['docs', 'access-tokens'], label: 'Getting Access Tokens' },
        { segment: ['docs', 'refresh-tokens'], label: 'Refreshing Tokens' },
        { segment: ['docs', 'gw2-api'], label: 'Guild Wars 2 API' },
        { segment: ['docs', 'scopes'], label: 'Scopes' },
        { segment: ['docs', 'best-practices'], label: 'Best Practices' },
        { segment: ['docs', 'branding'], label: 'Branding' },
        { segment: ['docs', 'api-reference'], label: 'API Reference' },
        { segment: ['docs', 'libraries'], label: 'Client Libraries' },
      ]}/>
      <Separator/>
      <Navigation prefix="/dev/" items={[
        { segment: 'applications', label: 'Your Applications' },
      ]}/>
    </NavLayout>
  );
}
