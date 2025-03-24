import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { LayoutProps } from '@/lib/next';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { NavBar } from './navbar';
import { getSessionOrRedirect } from '@/lib/session';
import { getApplicationById } from './helper';

export default async function DevApplicationDetailLayout({ params, children }: LayoutProps<{ id: string }>) {
  const { id } = await params;
  const { userId } = await getSessionOrRedirect();
  const application = await getApplicationById(id, userId);

  return (
    <PageLayout>
      <PageTitle>
        <FlexRow>
          <ApplicationImage fileId={application?.imageId} size={48}/>
          {application.name}
        </FlexRow>
      </PageTitle>
      <NavBar base={`/dev/applications/${id}/`} items={[
        { segment: '(settings)', label: 'Settings', href: `/dev/applications/${id}/` },
        { segment: 'clients', label: 'Clients' },
        { segment: 'users', label: 'Users' },
      ]}/>
      {children}
    </PageLayout>
  );
}
