import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Textarea } from '@/components/Textarea/Textarea';
import { editApplication } from '../_actions/edit';
import { Scope, Gw2MeClient } from '@gw2me/client';
import { resetClientSecret } from '../_actions/resetClientSecret';
import { ResetClientSecret } from './reset-client-secret';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Icon } from '@gw2treasures/ui';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Select, SelectProps } from '@gw2treasures/ui/components/Form/Select';

const getApplication = cache(async (id: string) => {
  const session = await getSessionOrRedirect();

  const application = await db.application.findFirst({
    where: { id, ownerId: session.userId }
  });

  if(!application) {
    notFound();
  }

  return application;
});

interface EditApplicationPageProps {
  params: {
    id: string;
  };
}

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const application = await getApplication(params.id);
  const emails = await db.userEmail.findMany({
    where: { userId: application.ownerId, verified: true },
  });

  const emailOptions: SelectProps['options'] = emails.map((email) => ({ value: email.id, label: email.email }));

  return (
    <PageLayout>
      <Headline id="app">{application.name}</Headline>

      <Form action={editApplication.bind(null, application.id)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Label label="Image">
            <FlexRow>
              {application.imageId && (
                <ApplicationImage fileId={application.imageId} size={64}/>
              )}
              <input type="file" name="image"/>
            </FlexRow>
          </Label>

          <Label label="Name">
            <TextInput name="name" defaultValue={application.name} value={undefined}/>
          </Label>

          <Label label="Description">
            <Textarea name="description" defaultValue={application.description}/>
          </Label>

          <Label label="Contact Email">
            <Select name="email" options={[{ label: '', value: '' }, ...emailOptions]} defaultValue={application.emailId ?? undefined}/>
          </Label>

          <Label label="Public">
            <Checkbox name="public" defaultChecked={application.public}>Show on <Link href="/discover">Discover</Link> page</Checkbox>
          </Label>

          <Label label="Public URL">
            <TextInput name="publicUrl" defaultValue={application.publicUrl} value={undefined}/>
          </Label>

          <Label label="Privacy Policy URL">
            <TextInput name="privacyPolicyUrl" defaultValue={application.privacyPolicyUrl} value={undefined}/>
          </Label>

          <Label label="Terms of Service URL">
            <TextInput name="termsOfServiceUrl" defaultValue={application.termsOfServiceUrl} value={undefined}/>
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
          <LinkButton target="_blank" href={new Gw2MeClient({ client_id: application.clientId }, { url: 'http://placeholder/' }).getAuthorizationUrl({ redirect_uri: application.callbackUrls[0], scopes: [Scope.Identify], prompt: 'consent', include_granted_scopes: true }).replace('http://placeholder/', '/')}>Test Link <Icon icon="external"/></LinkButton>
          <LinkButton href={`/dev/applications/${application.id}/delete`} icon="delete">Delete Application</LinkButton>
        </FlexRow>
      </Form>
    </PageLayout>
  );
}

export async function generateMetadata({ params }: EditApplicationPageProps) {
  const application = await getApplication(params.id);

  return {
    title: `Edit ${application.name}`
  };
}
