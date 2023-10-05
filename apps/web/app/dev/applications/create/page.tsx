import { createApplication } from '../_actions/create';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Form } from '@/components/Form/Form';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Label } from '@gw2treasures/ui/components/Form/Label';

export default function CreateApplicationPage() {
  return (
    <div>
      <Headline id="create">Create new application</Headline>

      <Form action={createApplication}>
        <Label label="Name">
          <TextInput name="name"/>
        </Label>
        <FlexRow>
          <Button type="submit">Submit</Button>
        </FlexRow>
      </Form>
    </div>
  );
}
