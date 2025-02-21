import { getSession, getSessionOrRedirect } from '@/lib/session';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Steps } from '@/components/Steps/Steps';
import Link from 'next/link';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { revalidatePath } from 'next/cache';
import { getFormDataString } from '@/lib/form-data';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { Icon } from '@gw2treasures/ui';

const getUserData = cache(async () => {
  const { userId } = await getSessionOrRedirect();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { emails: { orderBy: { email: 'asc' }}}
  });

  if(!user) {
    notFound();
  }

  return user;
});

export default async function ProfilePage() {
  const user = await getUserData();
  const Emails = createDataTable(user.emails, ({ id }) => id);

  return (
    <PageLayout>
      <Headline id="profile" actions={<form action="/logout" method="POST"><SubmitButton icon="logout">Logout</SubmitButton></form>}>
        {user.name}
      </Headline>

      <p>Thank you for signing up to gw2.me.</p>

      <Steps>
        <div><Link href="/accounts/add">Add your Guild Wars 2 Accounts</Link> by adding API Keys.</div>
        <div><Link href="/discover">Discover</Link> applications that support gw2.me.</div>
        <div>Get our <Link href="/extension">browser extension</Link> to generate subtokens for all other websites.</div>
        <div>Are your a developer? <Link href="/dev/applications">Manage your own applications</Link>.</div>
      </Steps>

      <Headline id="settings">Settings</Headline>
      <Form action={updateSettings}>
        <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
          <Label label="Username">
            <TextInput name="username" defaultValue={user.name}/>
          </Label>
          <FlexRow>
            <SubmitButton>Save</SubmitButton>
          </FlexRow>
        </div>
      </Form>

      <Headline id="emails" actions={(<LinkButton href="/emails/add" icon="add">Add Email</LinkButton>)}>Emails</Headline>
      <Form action={updateEmails}>
        <Emails.Table>
          <Emails.Column id="email" title="Email">{({ email }) => email}</Emails.Column>
          <Emails.Column id="default" title="Default">{({ isDefaultForUserId }) => isDefaultForUserId && <Icon icon="checkmark"/>}</Emails.Column>
          <Emails.Column id="verified" title="Verified">{({ verified }) => verified && <Icon icon="checkmark"/>}</Emails.Column>
          <Emails.Column small title="Actions" id="actions">
            {({ id, isDefaultForUserId }) => (
              <FlexRow>
                <Button icon="checkmark" disabled={!!isDefaultForUserId} type="submit" name="default" value={id}>Set as default</Button>
              </FlexRow>
            )}
          </Emails.Column>
        </Emails.Table>
      </Form>
    </PageLayout>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const user = await getUserData();

  return {
    title: user.name,
  };
}

async function updateSettings(_: FormState, formData: FormData): Promise<FormState> {
  'use server';

  // setup regex to test username
  const usernameRegex = /^[a-z0-9._-]{2,32}$/i;

  // get current user
  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  // get form data
  const username = getFormDataString(formData, 'username');

  // validate username
  if(username === undefined || !usernameRegex.test(username)) {
    return { error: 'Invalid username. The username can only contain latin characters (a-z), numbers and the special characters period (.), underscore (_) and dash (-) and must be between 2 and 32 characters long.' };
  }

  // check if username is not already taken
  const userExists = await db.user.findFirst({
    where: { name: username, id: { not: session.userId }},
    select: { id: true }
  });

  if(userExists) {
    return { error: 'Invalid username. The username is already taken.' };
  }

  // save
  await db.user.update({
    where: { id: session.userId },
    data: { name: username }
  });

  revalidatePath('/profile');
  return { success: 'Saved' };
}

async function updateEmails(_: FormState, formData: FormData): Promise<FormState> {
  'use server';

  const session = await getSession();
  if(!session) {
    return { error: 'Not logged in' };
  }

  const defaultEmailId = getFormDataString(formData, 'default');

  if(defaultEmailId) {
    await db.user.update({
      where: { id: session.userId },
      data: { defaultEmail: { connect: { id: defaultEmailId }}}
    });
  }

  revalidatePath('/profile');
  return { success: 'Email settings updated' };
}
