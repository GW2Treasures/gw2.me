import { Scope } from '@gw2me/client';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import Form from 'next/form';

export default function ButtonPage() {
  return (
    <Form action="/button/login">
      <Headline id="button">gw2.me Button</Headline>
      <p>
        gw2.me provides a button embed that uses FedCM if available, and falls back to the normal OAuth2 flow otherwise.
      </p>
      <Label label="Scopes">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {Object.values(Scope).map((scope) => (
            <Checkbox key={scope} name="scope" formValue={scope} defaultChecked={[Scope.Identify].includes(scope)}>{scope}</Checkbox>
          ))}
        </div>
      </Label>

      <div style={{ marginBottom: 32 }}/>

      <SubmitButton icon="chevron-right" iconColor="var(--color-brand)">Continue</SubmitButton>
    </Form>
  );
}

export const metadata = {
  title: 'Button',
};
