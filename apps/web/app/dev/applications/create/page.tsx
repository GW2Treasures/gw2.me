import { action } from '@/lib/action';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { randomBytes, randomUUID } from 'crypto';
import { redirect } from 'next/navigation';

const submit = action(async (data) => {
  'use server';

  const user = await getUser();
  const name = data.get('name');

  if(!name || !user) {
    throw new Error();
  }

  const application = await db.application.create({
    data: {
      name: name.toString(),
      clientId: randomUUID(),
      clientSecret: randomBytes(32).toString('hex'),
      ownerId: user?.id
    }
  });

  redirect(`/dev/applications/${application.id}`);
});

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
