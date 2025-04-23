import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { db } from '@/lib/db';
import { getSessionOrRedirect, getUser } from '@/lib/session';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { notFound } from 'next/navigation';
import { deleteApiKey, manageSharedUser, updateDisplayName } from './actions';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Code } from '@/components/Layout/Code';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { cache } from 'react';
import { PageProps } from '@/lib/next';
import { Permission } from '@gw2api/types/data/tokeninfo';
import { PermissionCount } from '@/components/Permissions/PermissionCount';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { scopeToPermissions } from '@/lib/scope';
import { Scope } from '@gw2me/client';
import { allPermissions } from '@/components/Permissions/data';
import Link from 'next/link';
import { createDataTable } from '@gw2treasures/ui/components/Table/DataTable';
import { FormatDate } from '@/components/Format/FormatDate';

const getAccount = cache(async function getAccount(id: string) {
  const session = await getSessionOrRedirect();

  const account = await db.account.findUnique({
    where: { id, userId: session.userId },
    include: {
      apiTokens: true,
      shares: { include: { user: { select: { name: true }}}},
    }
  });

  if(!account) {
    notFound();
  }

  return account;
});

const getApplications = cache(function getApplications(accountId: string, userId: string) {
  return db.applicationGrant.findMany({
    where: {
      OR: [
        { userId, accounts: { some: { id: accountId }}},
        { sharedAccounts: { some: { account: { userId, id: accountId }}}}
      ]
    },
    select: {
      id: true,
      scope: true,
      application: { select: { id: true, name: true, imageId: true }},
      user: { select: { id: true, name: true }},
    }
  });
});

type AccountPageProps = PageProps<{ id: string }>;

export default async function AccountPage({ params }: AccountPageProps) {
  const { id } = await params;
  const user = await getUser();
  const account = await getAccount(id);
  const applications = await getApplications(account.id, account.userId);

  const hasApplicationMissingPermissions = applications.some((authorization) => {
    const requiredPermissions = scopeToPermissions(authorization.scope as Scope[]);
    return !hasApiTokenWithRequiredPermissions(account.apiTokens, requiredPermissions);
  });

  const hasApplicationGrantsForOtherUsers = applications.some((grant) => grant.user.id !== account.userId);

  const Shares = createDataTable(account.shares, ({ id }) => id);

  return (
    <PageLayout>
      <Headline id="account" actions={!account.verified && (<LinkButton href={`/accounts/${account.id}/verify`} icon="verified">Verify</LinkButton>)}>
        <FlexRow>
          {account.accountName}
          {account.verified && <Tip tip="Verified"><Icon icon="verified"/></Tip>}
        </FlexRow>
      </Headline>

      <Form action={updateDisplayName.bind(null, id)}>
        <Label label="Custom Name">
          <TextInput name="displayName" placeholder={account.accountName} defaultValue={account.displayName ?? ''}/>
        </Label>
        <FlexRow>
          <SubmitButton>Update</SubmitButton>
        </FlexRow>
      </Form>

      <Headline id="api-keys" actions={<LinkButton href="/accounts/add" icon="key-add">Add API Key</LinkButton>}>API Keys</Headline>

      {(!hasApiTokenWithRequiredPermissions(account.apiTokens, allPermissions)) && (
        <Notice>
          None of your API keys contains all permissions. It is recommended to grant all permissions, as some applications may require them. Authorized applications will still only be able to access the data you allow them to.
        </Notice>
      )}

      <Form action={deleteApiKey}>
        <Table>
          <thead>
            <tr>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>API Key</Table.HeaderCell>
              <Table.HeaderCell>Permissions</Table.HeaderCell>
              <Table.HeaderCell small>Actions</Table.HeaderCell>
            </tr>
          </thead>
          <tbody>
            {account.apiTokens.map((token) => (
              <tr key={token.id}>
                <td><FlexRow><Icon icon="key"/>{token.name}</FlexRow></td>
                <td>
                  <FlexRow>
                    <Code inline borderless><span style={{ maxWidth: '36ch', display: 'inline-block', wordBreak: 'break-all' }}>{token.token.slice(0, 36)}<wbr/>{token.token.slice(36)}</span></Code>
                    <Tip tip="Copy API Key">
                      <CopyButton iconOnly icon="copy" copy={token.token} appearance="tertiary"/>
                    </Tip>
                  </FlexRow>
                </td>
                <td><PermissionCount permissions={token.permissions as Permission[]}/></td>
                <td><Button type="submit" icon="delete" intent="delete" name="apiKeyId" value={token.id}>Delete</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Form>

      <Headline id="shareAccount" actions={<LinkButton icon="share" href={`/accounts/${account.id}/share`}>Share</LinkButton>}>
        Share Account
      </Headline>
      <p>Share this account with your friends. They will never be able to access your API keys.</p>

      <Form action={manageSharedUser}>
        {account.shares.length > 0 ? (
          <Shares.Table>
            <Shares.Column id="user" title="User">{({ user }) => user.name}</Shares.Column>
            <Shares.Column id="status" title="Status">{({ state }) => state}</Shares.Column>
            <Shares.Column id="createdAt" title="Shared since">{({ createdAt }) => <FormatDate date={createdAt}/>}</Shares.Column>
            <Shares.Column id="actions" title="Actions" small>{({ id }) => <Button type="submit" name="removeSharedAccountId" value={id} icon="delete">Remove</Button>}</Shares.Column>
          </Shares.Table>
        ) : account.verified && (
          <p>You have not shared your account with anyone yet.</p>
        )}
      </Form>

      <Headline id="applications">Authorized Applications</Headline>

      {hasApplicationMissingPermissions && (
        <Notice type="warning">
          Some applications require permissions that are not granted by any of your API keys.
          Add a new API key with the required permissions to use these applications.
        </Notice>
      )}

      {applications.length === 0 ? (
        <p>
          You have not authorized any applications to access this account yet.{' '}
          <Link href="/discover">Discover</Link> applications that can use your account data.
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Table.HeaderCell>Name</Table.HeaderCell>
              {hasApplicationGrantsForOtherUsers && (<Table.HeaderCell>User</Table.HeaderCell>)}
              <Table.HeaderCell>Required Permissions</Table.HeaderCell>
            </tr>
          </thead>
          <tbody>
            {applications.map((grant) => (
              <tr key={grant.id}>
                <td>
                  <FlexRow>
                    <ApplicationImage fileId={grant.application.imageId}/> {grant.application.name}
                    {!hasApiTokenWithRequiredPermissions(account.apiTokens, scopeToPermissions(grant.scope as Scope[])) && (
                      <Tip tip="Missing permissions"><Icon icon="warning" color="#ffa000"/></Tip>
                    )}
                  </FlexRow>
                </td>
                {hasApplicationGrantsForOtherUsers && (
                  <td>
                    {grant.user.id === account.userId
                      ? <FlexRow><Icon icon="user"/> {user!.name}</FlexRow>
                      : <FlexRow><Icon icon="share"/> {grant.user.name}</FlexRow>}
                  </td>
                )}
                <td><PermissionList permissions={scopeToPermissions(grant.scope as Scope[])}/></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageLayout>
  );
}

export async function generateMetadata({ params }: AccountPageProps) {
  const { id } = await params;
  const account = await getAccount(id);

  return {
    title: account.displayName
      ? `${account.displayName} (${account.accountName})`
      : account.accountName
  };
}

function hasApiTokenWithRequiredPermissions(apiTokens: { permissions: string[] }[], requiredPermissions: Permission[]): boolean {
  return apiTokens.some((token) => requiredPermissions.every((permission) => token.permissions.includes(permission)));
}
