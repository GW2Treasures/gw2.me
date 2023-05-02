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
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';

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

      <ActionForm action={editApplication}>
        <input type="hidden" name="id" value={application.id}/>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Label label="Name">
            <TextInput name="name" defaultValue={application.name} value={undefined}/>
          </Label>

          <Label label="Description">
            <Textarea name="description" defaultValue={application.description}/>
          </Label>

          <Label label="Public">
            <Checkbox name="public" defaultChecked={application.public}>Show on <Link href="/discover">Discover</Link> page</Checkbox>
          </Label>

          <Label label="Public URL">
            <TextInput name="publicUrl" defaultValue={application.publicUrl} value={undefined}/>
          </Label>

          <Label label="Redirect URLs">
            <Textarea name="callbackUrls" defaultValue={application.callbackUrls.join('\n')}/>
          </Label>

          <Label label="Client ID">
            <TextInput value={application.clientId} readOnly/>
          </Label>

          <Label label="Client Secret">
            <ResetClientSecret applicationId={application.id} reset={resetClientSecret}/>
          </Label>
        </div>
      </ActionForm>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <Button form={editApplication.$$id}>Save</Button>
        <LinkButton external href={getAuthorizationUrl({ redirect_uri: application.callbackUrls[0], client_id: application.clientId, scopes: [Scope.Identify] })}>Test Link</LinkButton>
        <Button form={deleteApplication.$$id}>Delete Application</Button>
      </div>
    </div>
  );
}
