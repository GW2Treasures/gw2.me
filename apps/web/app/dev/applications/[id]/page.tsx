import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { deleteApplication } from '../_actions/delete';
import { Textarea } from '@/components/Textarea/Textarea';
import { editApplication } from '../_actions/edit';
import { Scope, getAuthorizationUrl } from '@gw2me/client';
import { resetClientSecret } from '../_actions/resetClientSecret';
import { ResetClientSecret } from './reset-client-secret';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { Form } from '@/components/Form/Form';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Separator } from '@gw2treasures/ui/components/Layout/Separator';
import { Icon } from '@gw2treasures/ui';
import { Select } from '@gw2treasures/ui/components/Form/Select';
import { ApplicationTypeOptions } from '../_actions/helper';
import { PageLayout } from '@/components/Layout/PageLayout';

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
    <PageLayout>
      <Headline id="app">{application.name}</Headline>

      <Form action={editApplication.bind(null, application.id)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Label label="Image">
            <FlexRow>
              { /* eslint-disable-next-line @next/next/no-img-element */}
              {application.image !== null && (<img src={`data:image/png;base64,${application.image?.toString('base64')}`} alt="" width={64} height={64}/>)}
              <input type="file" name="image"/>
            </FlexRow>
          </Label>

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

          <b style={{ marginTop: 16 }}>OAuth2 Client Information</b>

          <Label label="Type">
            <TextInput readOnly value={application.type}/>
          </Label>

          <div>
            <FlexRow wrap>
              <Label label="Client ID">
                <TextInput value={application.clientId} readOnly/>
                <CopyButton copy={application.clientId} icon="copy">Copy</CopyButton>
              </Label>

              {application.type === 'Confidential' && (
                <Label label="Client Secret">
                  <ResetClientSecret applicationId={application.id} reset={resetClientSecret} hasClientSecret={application.clientSecret !== null}/>
                </Label>
              )}
            </FlexRow>
          </div>

          <Label label="Redirect URLs">
            <Textarea name="callbackUrls" defaultValue={application.callbackUrls.join('\n')}/>
          </Label>
        </div>

        <FlexRow wrap>
          <SubmitButton>Save</SubmitButton>
          <LinkButton target="_blank" href={getAuthorizationUrl({ redirect_uri: application.callbackUrls[0], client_id: application.clientId, scopes: [Scope.Identify] })}>Test Link <Icon icon="external"/></LinkButton>
          <LinkButton href={`/dev/applications/${application.id}/delete`} icon="delete">Delete Application</LinkButton>
        </FlexRow>
      </Form>
    </PageLayout>
  );
}
