import { createApplication } from '../_actions/create';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { Select, SelectProps } from '@gw2treasures/ui/components/Form/Select';
import { ApplicationTypeOptions } from '../_actions/helper';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import Link from 'next/link';
import { PageLayout } from '@/components/Layout/PageLayout';
import { getSessionOrRedirect } from '@/lib/session';
import { db } from '@/lib/db';

export default async function CreateApplicationPage() {
  const { userId } = await getSessionOrRedirect();
  const emails = await db.userEmail.findMany({
    where: { userId, verified: true },
  });

  const emailOptions: SelectProps['options'] = emails.map((email) => ({ value: email.id, label: email.email }));
  const defaultEmailId = emails.find((email) => email.isDefaultForUserId)?.id;

  return (
    <PageLayout>
      <Headline id="create">Create new application</Headline>

      <Form action={createApplication}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Label label="Name">
            <TextInput name="name"/>
          </Label>

          <Label label={<>Type (See <Link href="/dev/docs/register-app#public-confidential">documentation</Link> for distinction)</>}>
            <Select name="type" options={[{ value: '', label: '' }, ...ApplicationTypeOptions]}/>
          </Label>

          <Label label={<>Verified Contact Email (<Link href="/profile#emails">Manage Emails</Link>)</>}>
            <Select name="email" options={emailOptions} defaultValue={defaultEmailId}/>
          </Label>

          <FlexRow>
            <SubmitButton type="submit">Create Application</SubmitButton>
          </FlexRow>
        </div>
      </Form>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Create Application'
};
