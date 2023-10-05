/* eslint-disable @next/next/no-img-element */
import { db } from '@/lib/db';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import styles from './page.module.css';
import { ApplicationImage } from '@/components/Application/ApplicationImage';

export const revalidate = 300;

const getApplications = async () => {
  const applications = await db.application.findMany({
    where: { public: true },
    select: { id: true, name: true, description: true, publicUrl: true }
  });

  return applications;
};

export default async function DiscoverPage() {
  const applications = await getApplications();

  return (
    <>
      <Headline id="applications">Discover applications using gw2.me</Headline>
      <div className={styles.apps}>
        {applications.map((app) => (
          <a key={app.id} className={styles.app} href={app.publicUrl} target="_blank" rel="noreferrer noopener">
            <ApplicationImage applicationId={app.id} size={64}/>
            <div className={styles.title}>{app.name}</div>
            <p>{app.description}</p>
          </a>
        ))}
      </div>
    </>
  );
}
