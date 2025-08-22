import { getSessionOrRedirect } from '@/lib/session';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { Select } from '@gw2treasures/ui/components/Form/Select';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ClientTypeOptions } from 'app/dev/applications/_actions/helper';
import Link from 'next/link';
import { getApplicationById } from '../../helper';
import { addClient } from '../_actions/add';
import { Metadata } from 'next';

export default async function ClientsAddPage({ params }: PageProps<'/dev/applications/[id]/clients/add'>) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(id, session.userId);

  return (
    <>
      <p>Check the <a href="/dev/docs/manage-apps#client">documentation</a> for more information on how to manage your OAuth2 clients.</p>

      <Form action={addClient.bind(null, application.id)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Label label="Name">
            <TextInput name="name"/>
          </Label>

          <Label label={<>Type (See <Link href="/dev/docs/manage-apps#public-confidential">documentation</Link> for distinction)</>}>
            <Select name="type" options={[{ value: '', label: '' }, ...ClientTypeOptions]}/>
          </Label>

          <FlexRow>
            <SubmitButton type="submit" icon="add">Create Client</SubmitButton>
          </FlexRow>
        </div>
      </Form>
    </>
  );
}

export async function generateMetadata({ params }: PageProps<'/dev/applications/[id]/clients/add'>): Promise<Metadata> {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const application = await getApplicationById(id, session.userId);

  return {
    title: `Edit ${application.name} / Add Client`
  };
}
