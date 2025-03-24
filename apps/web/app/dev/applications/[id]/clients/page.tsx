import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { db } from '@/lib/db';
import { notExpired } from '@/lib/db/helper';
import { PageProps } from '@/lib/next';
import { getSessionOrRedirect } from '@/lib/session';
import { Icon } from '@gw2treasures/ui';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import Link from 'next/link';
import { getApplicationById } from '../helper';
import styles from './page.module.css';

const getClients = (applicationId: string, ownerId: string) => {
  return db.client.findMany({
    where: { applicationId, application: { ownerId }},
    include: {
      _count: { select: { authorizations: { where: { ...notExpired, type: { in: ['AccessToken', 'RefreshToken'] }}}}}
    }
  });
};

type ClientsPageProps = PageProps<{ id: string }>;

export default async function ClientsPage({ params }: ClientsPageProps) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const clients = await getClients(id, session.userId);

  return (
    <>
      <p>Check the <a href="/dev/docs/manage-apps#client">documentation</a> for more information on how to manage your OAuth2 clients.</p>

      <div className={styles.clients}>
        {clients.map((client) => (
          <Link key={client.id} className={styles.client} href={`/dev/applications/${id}/clients/${client.id}`} aria-label={`Manage client ${client.name}`}>
            <div className={styles.title}>{client.name} <span className={styles.type}>{client.type}</span></div>
            <div>Client ID: <Code inline borderless>{client.id}</Code></div>
            <div>{client._count.authorizations} active Authorizations</div>
            <div>Created at <FormatDate date={client.createdAt}/></div>
            <Icon className={styles.chevron} icon="chevron-right"/>
          </Link>
        ))}
      </div>

      <FlexRow>
        <LinkButton icon="add" href={`/dev/applications/${id}/clients/add`}>Create Client</LinkButton>
      </FlexRow>
    </>
  );
}

export async function generateMetadata({ params }: ClientsPageProps) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(id, session.userId);

  return {
    title: `Edit ${application.name} / Clients`
  };
}
