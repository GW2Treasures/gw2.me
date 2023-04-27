import { ActionForm } from '@/components/ActionForm/ActionForm';
import { createApplication } from '../_actions/create';

export default function CreateApplicationPage() {
  return (
    <div>
      <h1>Create new application</h1>

      <ActionForm action={createApplication}>
        <input name="name"/>
        <button>Submit</button>
      </ActionForm>
    </div>
  );
}
