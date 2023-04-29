import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { deleteApplication } from '../_actions/delete';
import { ActionForm } from '@/components/ActionForm/ActionForm';
import { Textarea } from '@/components/Textarea/Textarea';
import { editApplication } from '../_actions/edit';
import { Scope, getAuthorizationUrl } from '@gw2me/api';
import { resetClientSecret } from '../_actions/resetClientSecret';
import { ResetClientSecret } from './reset-client-secret';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';

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
      <ActionForm action={deleteApplication}>
        <input type="hidden" name="id" value={application.id}/>
      </ActionForm>

      <Link href="/dev/applications">← List of Applications</Link>
      <Headline id="app">{application.name}</Headline>

      <Label label="Redirect URLs">
        <ActionForm action={editApplication}>
          <input type="hidden" name="id" value={application.id}/>
          <Textarea name="callbackUrls" defaultValue={application.callbackUrls.join('\n')}/>
        </ActionForm>
      </Label>

      <Label label="Client ID">
        <TextInput value={application.clientId} readOnly/>
      </Label>

      <Label label="Client Secret">
        <ResetClientSecret applicationId={application.id} reset={resetClientSecret}/>
      </Label>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <Button form={editApplication.$$id}>Save</Button>
        <LinkButton external href={getAuthorizationUrl({ redirect_uri: application.callbackUrls[0], client_id: application.clientId, scopes: [Scope.Identify] })}>Test Link</LinkButton>
        <Button form={deleteApplication.$$id}>Delete Application</Button>
      </div>
    </div>
  );
}
