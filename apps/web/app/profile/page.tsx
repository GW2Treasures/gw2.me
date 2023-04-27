import { getUser } from '@/lib/getUser';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import Link from 'next/link';

const getUserData = cache(async () => {
  const session = await getUser();

  if(!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: { sessions: true, providers: true },
  });

  if(!user) {
    redirect('/login');
  }

  return {
    sessionId: session.sessionId,
    user,
  };
});

export default async function ProfilePage() {
  const { sessionId, user } = await getUserData();

  return (
    <div>
      <h1>{user.name}</h1>
      <a href="/logout">Logout</a>

      <h2 id="providers">Login Providers</h2>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>User</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {user.providers.map((provider) => (
            <tr key={`${provider.provider}-${provider.providerAccountId}`}>
              <td>{provider.provider}</td>
              <td>{provider.displayName}</td>
              <td>{provider.createdAt.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="sessions">Sessions</h2>
      <table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Started</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <tbody>
          {user.sessions.map((session) => (
            <tr key={session.id}>
              <td>{session.info}{session.id === sessionId && ' (Current Session)'}</td>
              <td>{session.createdAt.toISOString()}</td>
              <td>{session.lastUsed.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="applications">Authorized Apps</h2>
      Are you a developer? <Link href="/dev/applications">Manage your own apps</Link>.
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { user } = await getUserData();

  return {
    title: user.name,
  };
};
