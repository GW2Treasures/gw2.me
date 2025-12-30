import { db } from '@/lib/db';
import styles from './page.module.css';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Icon } from '@gw2treasures/ui';
import { PageTitle } from '@/components/Layout/PageTitle';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';

const getApplications = unstable_cache(async function getApplications() {
  const applications = await db.application.findMany({
    where: { public: true },
    select: { id: true, name: true, description: true, publicUrl: true, imageId: true },
    orderBy: { users: { _count: 'desc' }}
  });

  return applications;
}, ['discover'], { revalidate: 300, tags: ['discover'] });

export default async function DiscoverPage() {
  const applications = await getApplications();

  return (
    <PageLayout>
      <PageTitle>Discover</PageTitle>
      <p>Here are some of the public applications that support gw2.me.</p>
      <div className={styles.apps}>
        {applications.map((app) => (
          <a key={app.id} className={styles.app} href={app.publicUrl} target="_blank" rel="noreferrer noopener">
            <ApplicationImage fileId={app.imageId} size={64}/>
            <div className={styles.title}>{app.name} <Icon icon="external-link"/></div>
            <p>{app.description}</p>
          </a>
        ))}
      </div>
    </PageLayout>
  );
}

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Discover applications with gw2.me integration',
};
