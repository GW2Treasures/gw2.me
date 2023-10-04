/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import Link from 'next/link';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { AuthorizationType } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';

const getUserData = cache(async () => {
  const session = await getUser();

  if(!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      sessions: true,
      providers: true,
      authorizations: {
        where: { type: AuthorizationType.RefreshToken },
        include: { application: { select: { name: true }}},
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if(!user) {
    redirect('/login');
  }

  const accounts = await db.account.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: {
          authorizations: { where: { type: AuthorizationType.AccessToken }},
          apiTokens: true
        }
      }
    },
  });

  return {
    sessionId: session.sessionId,
    user,
    accounts,
  };
});

export default async function ProfilePage() {
  const { sessionId, user, accounts } = await getUserData();

  return (
    <div>
      <Headline id="profile" actions={<LinkButton href="/logout" external>Logout</LinkButton>}>{user.name}</Headline>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await getUserData();

  return {
    title: user.name,
  };
};
