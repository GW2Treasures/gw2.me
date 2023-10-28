import { db } from '@/lib/db';
import styles from './page.module.css';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Icon } from '@gw2treasures/ui';
import { PageTitle } from '@/components/Layout/PageTitle';

export const revalidate = 300;

const getApplications = async () => {
  const applications = await db.application.findMany({
    where: { public: true },
    select: { id: true, name: true, description: true, publicUrl: true, imageId: true }
  });

  return applications;
};

export default async function DiscoverPage() {
  const applications = await getApplications();

  return (
    <PageLayout>
      <PageTitle>Discover</PageTitle>
      <p>Here are some of the applications that support gw2.me.</p>
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

export const metadata = {
  title: 'Discover',
  description: 'Discover applications with gw2.me integration',
};
