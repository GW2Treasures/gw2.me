import { createApplication } from '../_actions/create';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';

export default function CreateApplicationPage() {
  return (
    <div>
      <Headline id="create">Create new application</Headline>

      <form action={createApplication}>
        <TextInput name="name"/>
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
