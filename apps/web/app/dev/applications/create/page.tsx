import { submit } from '../_actions/create';

export default function CreateApplicationPage() {
  return (
    <div>
      <h1>Create new application</h1>

      <form method="POST" action="">
        <input type="hidden" name="$$id" value={submit.$$id}/>
        <input name="name"/>
        <button>Submit</button>
      </form>
    </div>
  );
}
