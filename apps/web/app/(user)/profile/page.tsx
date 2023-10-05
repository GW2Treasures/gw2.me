/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Steps } from '@/components/Steps/Steps';
import Link from 'next/link';

const getUserData = cache(async () => {
  const session = await getUser();

  if(!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.id }
  });

  if(!user) {
    redirect('/login');
  }

  return {
    sessionId: session.sessionId,
    user
  };
});

export default async function ProfilePage() {
  const { user } = await getUserData();

  return (
    <div>
      <Headline id="profile" actions={<LinkButton href="/logout" external>Logout</LinkButton>}>{user.name}</Headline>

      <p>Thank you for signing up to gw2.me.</p>

      <Steps>
        <div><Link href="/accounts/add">Add your Guild Wars 2 Accounts</Link> by adding API Keys.</div>
        <div><Link href="/discover">Discover</Link> applications that support gw2.me.</div>
        <div>Are your a developer? <Link href="/dev/applications">Manage your own applications</Link>.</div>
      </Steps>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await getUserData();

  return {
    title: user.name,
  };
};
