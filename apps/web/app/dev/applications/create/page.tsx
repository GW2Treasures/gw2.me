import { createApplication } from '../_actions/create';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Form } from '@/components/Form/Form';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { Select } from '@gw2treasures/ui/components/Form/Select';
import { ApplicationTypeOptions } from '../_actions/helper';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import Link from 'next/link';
import { PageLayout } from '@/components/Layout/PageLayout';

export default function CreateApplicationPage() {
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

          <FlexRow>
            <SubmitButton type="submit">Create Application</SubmitButton>
          </FlexRow>
        </div>
      </Form>
    </PageLayout>
  );
}
