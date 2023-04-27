import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { deleteApplication } from '../_actions/delete';
import { ActionForm } from '@/components/ActionForm/ActionForm';
import { editApplication } from '../_actions/edit';
import { Scope, getAuthorizationUrl } from '@gw2me/api';

const getApplication = cache(async (id: string) => {
  const user = await getUser();

  if(!user) {
    notFound();
  }

  return db.application.findFirst({ where: { id, ownerId: user.id }});
});

export default async function EditApplicationPage({ params }: { params: { id: string }}) {
  const application = await getApplication(params.id);

  if(!application) {
    notFound();
  }

  return (
    <div>
      <Link href="/dev/applications">← List of Applications</Link>
      <h1>{application.name}</h1>

      <ActionForm action={editApplication}>
        <input type="hidden" name="id" value={application.id}/>
        <textarea name="callbackUrls" defaultValue={application.callbackUrls.join('\n')}/>
        <hr/>
        <button>Save</button>
      </ActionForm>

      <pre>{JSON.stringify(application, undefined, 2)}</pre>

      <a href={getAuthorizationUrl({ redirect_uri: application.callbackUrls[0], client_id: application.clientId, scopes: [Scope.Identify] })}>Test Link</a>

      <ActionForm action={deleteApplication}>
        <input type="hidden" name="id" value={application.id}/>
        <button>Delete Application</button>
      </ActionForm>
    </div>
  );
}
