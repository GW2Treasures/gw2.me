import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { FormatDate } from '@/components/Format/FormatDate';
import { Code } from '@/components/Layout/Code';
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import { Provider } from '@/components/Provider/Provider';
import { ColumnSelection } from '@/components/Table/ColumnSelection';
import { db } from '@/lib/db';
import { getFormDataString } from '@/lib/form-data';
import { sendEmailVerificationMail } from '@/lib/mail/email-verification';
import { Icon } from '@gw2treasures/ui';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { ensureUserIsAdmin } from 'app/admin/admin';
import { notFound } from 'next/navigation';
import { cache } from 'react';

const getUser = cache(function getUser(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      authorizations: {
        include: {
          client: {
            include: {
              application: { select: { name: true, imageId: true }},
            }
          },
          email: { select: { email: true }}
        }
      },
      accounts: {
        select: { id: true, accountId: true, accountName: true, displayName: true, verified: true, createdAt: true, apiTokens: { select: { id: true }}}
      },
      providers: true,
      emails: {
        include: { _count: { select: { authorizations: true }}},
        orderBy: { email: 'asc' }
      },
      sessions: {
        orderBy: { lastUsed: 'desc' }
      },
    }
  });
});

export default async function AdminUserDetailPage({ params }: { params: { id: string }}) {
  await ensureUserIsAdmin();
  const user = await getUser(params.id);

  if(!user) {
    notFound();
  }

  const Authorizations = createDataTable(user.authorizations, ({ id }) => id);
  const Accounts = createDataTable(user.accounts, ({ id }) => id);
  const Providers = createDataTable(user.providers, ({ provider, providerAccountId }) => `${provider}:${providerAccountId}`);
  const Emails = createDataTable(user.emails, ({ id }) => id);
  const Sessions = createDataTable(user.sessions, ({ id }) => id);

  return (
    <PageLayout>
      <PageTitle>{user.name}</PageTitle>

      <Headline id="authorizations" actions={<ColumnSelection table={Authorizations}/>}>Authorizations ({user.authorizations.length})</Headline>
      <Authorizations.Table>
        <Authorizations.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Authorizations.Column>
        <Authorizations.Column id="app" title="App">{({ client }) => <FlexRow><ApplicationImage fileId={client.application.imageId}/> {client.application.name}</FlexRow>}</Authorizations.Column>
        <Authorizations.Column id="clientId" title="Client Id" hidden>{({ client }) => <Code inline borderless>{client.id}</Code>}</Authorizations.Column>
        <Authorizations.Column id="type" title="Type" sortBy="type">{({ type }) => type}</Authorizations.Column>
        <Authorizations.Column id="scope" title="Scope" hidden>{({ scope }) => scope.join(' ')}</Authorizations.Column>
        <Authorizations.Column id="email" title="Email" hidden>{({ email }) => email?.email}</Authorizations.Column>
        <Authorizations.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Authorizations.Column>
        <Authorizations.Column id="expiresAt" title="Expires At" sortBy="expiresAt">{({ expiresAt }) => expiresAt ? <FormatDate date={expiresAt}/> : 'Never'}</Authorizations.Column>
        <Authorizations.Column id="usedAt" title="Used At" sortBy="usedAt">{({ usedAt }) => usedAt ? <FormatDate date={usedAt}/> : 'Never'}</Authorizations.Column>
      </Authorizations.Table>

      <Headline id="accounts" actions={<ColumnSelection table={Accounts}/>}>Accounts ({user.accounts.length})</Headline>
      <Accounts.Table>
        <Accounts.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Accounts.Column>
        <Accounts.Column id="accountId" title="Account Id" hidden>{({ accountId }) => <Code inline borderless>{accountId}</Code>}</Accounts.Column>
        <Accounts.Column id="name" title="Name">{({ accountName }) => accountName}</Accounts.Column>
        <Accounts.Column id="display" title="Display Name">{({ displayName }) => displayName}</Accounts.Column>
        <Accounts.Column id="verified" title="Verified">{({ verified }) => verified && <Icon icon="checkmark"/>}</Accounts.Column>
        <Accounts.Column id="tokens" title="API keys">{({ apiTokens }) => apiTokens.length}</Accounts.Column>
        <Accounts.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Accounts.Column>
      </Accounts.Table>

      <Headline id="providers" actions={<ColumnSelection table={Providers}/>}>Providers ({user.providers.length})</Headline>
      <Providers.Table>
        <Providers.Column id="provider" title="Provider">{({ provider }) => <Provider provider={provider}/>}</Providers.Column>
        <Providers.Column id="providerId" title="Provider Id" hidden>{({ providerAccountId }) => <Code inline borderless>{providerAccountId}</Code>}</Providers.Column>
        <Providers.Column id="name" title="Name">{({ displayName }) => displayName}</Providers.Column>
        <Providers.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Providers.Column>
        <Providers.Column id="usedAt" title="Used At" sortBy="usedAt">{({ usedAt }) => usedAt ? <FormatDate date={usedAt}/> : 'never'}</Providers.Column>
      </Providers.Table>

      <Headline id="emails" actions={<ColumnSelection table={Emails}/>}>Emails ({user.emails.length})</Headline>
      <Form action={emailAction}>
        <Emails.Table>
          <Emails.Column id="id" title="Id" hidden>{({ id }) => <Code inline borderless>{id}</Code>}</Emails.Column>
          <Emails.Column id="email" title="Email">{({ email }) => email}</Emails.Column>
          <Emails.Column id="default" title="Default">{({ isDefaultForUserId }) => isDefaultForUserId && <Icon icon="checkmark"/>}</Emails.Column>
          <Emails.Column id="verified" title="Verified">{({ verified, verificationToken }) => verified ? <Icon icon="checkmark"/> : !!verificationToken && <Icon icon="time"/>}</Emails.Column>
          <Emails.Column id="authorizations" title="Authorizations">{({ _count }) => _count.authorizations}</Emails.Column>
          <Emails.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Emails.Column>
          <Emails.Column small title="Actions" id="actions">
            {({ id, verified }) => (
              <FlexRow>
                <Button icon="mail" disabled={verified} type="submit" name={EMAIL_ACTION_SEND_VERIFICATION} value={id}>Send Verification</Button>
              </FlexRow>
            )}
          </Emails.Column>
        </Emails.Table>
      </Form>

      <Headline id="sessions" actions={<ColumnSelection table={Sessions}/>}>Sessions ({user.sessions.length})</Headline>
      <Sessions.Table>
        <Sessions.Column id="session" title="Session">{({ info }) => info}</Sessions.Column>
        <Sessions.Column id="createdAt" title="Created At" sortBy="createdAt">{({ createdAt }) => <FormatDate date={createdAt}/>}</Sessions.Column>
        <Sessions.Column id="lastUsedAt" title="Last Used At" sortBy="lastUsed">{({ lastUsed }) => <FormatDate date={lastUsed}/>}</Sessions.Column>
      </Sessions.Table>
    </PageLayout>
  );
}

export async function generateMetadata({ params }: { params: { id: string }}) {
  await ensureUserIsAdmin();
  const user = await getUser(params.id);

  return {
    title: `User ${user?.name}`
  };
}

const EMAIL_ACTION_SEND_VERIFICATION = 'send-verification';

async function emailAction(_: FormState, formData: FormData): Promise<FormState> {
  'use server';

  const sendVerification = getFormDataString(formData, EMAIL_ACTION_SEND_VERIFICATION);

  try {
    if(sendVerification) {
      await sendEmailVerificationMail(sendVerification);
      return { success: 'Verification email sent.' };
    }
  } catch(e) {
    console.error(e);
    return { error: 'Internal server error' };
  }

  return { error: 'Unknown action' };
}
