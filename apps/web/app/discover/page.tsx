/* eslint-disable @next/next/no-img-element */
import { db } from '@/lib/db';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import styles from './page.module.css';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Icon } from '@gw2treasures/ui';

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
      <Headline id="applications">Discover applications using gw2.me</Headline>
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
