import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { notFound } from 'next/navigation';
import { removeAccount, updateDisplayName } from './actions';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { cache } from 'react';
import { Permission } from '@gw2api/types/data/tokeninfo';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { scopeToPermissions } from '@/lib/scope';
import { Scope } from '@gw2me/client';
import Link from 'next/link';
import { Metadata } from 'next';

const getSharedAccount = cache(async function getSharedAccount(id: string) {
  const session = await getSessionOrRedirect();

  const sharedAccount = await db.sharedAccount.findUnique({
    where: { id, userId: session.userId },
    include: {
      account: { select: { accountName: true, apiTokens: { select: { permissions: true }}}}
    }
  });

  if(!sharedAccount) {
    notFound();
  }

  return sharedAccount;
});

const getApplications = cache(function getApplications(sharedAccountId: string, userId: string) {
  return db.applicationGrant.findMany({
    where: {
      sharedAccounts: { some: { userId, id: sharedAccountId }}
    },
    select: {
      id: true,
      scope: true,
      application: { select: { id: true, name: true, imageId: true }},
      user: { select: { id: true, name: true }},
    }
  });
});

export default async function AccountPage({ params }: PageProps<'/accounts/shared/[id]'>) {
  const { id } = await params;
  const sharedAccount = await getSharedAccount(id);
  const applications = await getApplications(sharedAccount.id, sharedAccount.userId);

  const hasApplicationMissingPermissions = applications.some((authorization) => {
    const requiredPermissions = scopeToPermissions(authorization.scope as Scope[]);
    return !hasApiTokenWithRequiredPermissions(sharedAccount.account.apiTokens, requiredPermissions);
  });

  return (
    <PageLayout>
      <Form action={removeAccount.bind(null, id)}>
        <div style={{ marginBottom: 16 }}>
          <Headline id="account" actions={<SubmitButton intent="delete" icon="delete">Remove</SubmitButton>}>
            {sharedAccount.account.accountName}
          </Headline>
        </div>
      </Form>

      <Form action={updateDisplayName.bind(null, id)}>
        <Label label="Custom Name">
          <TextInput name="displayName" placeholder={sharedAccount.account.accountName} defaultValue={sharedAccount.displayName ?? ''}/>
        </Label>
        <FlexRow>
          <SubmitButton>Update</SubmitButton>
        </FlexRow>
      </Form>

      <Headline id="applications">Authorized Applications</Headline>

      {hasApplicationMissingPermissions && (
        <Notice type="warning">
          Some applications require permissions that are not granted by any of the API keys for this account.
          The owner of this account has to add a new API key with the required permissions.
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
              <Table.HeaderCell>Required Permissions</Table.HeaderCell>
            </tr>
          </thead>
          <tbody>
            {applications.map((grant) => (
              <tr key={grant.id}>
                <td>
                  <FlexRow>
                    <ApplicationImage fileId={grant.application.imageId}/> {grant.application.name}
                    {!hasApiTokenWithRequiredPermissions(sharedAccount.account.apiTokens, scopeToPermissions(grant.scope as Scope[])) && (
                      <Tip tip="Missing permissions"><Icon icon="warning" color="#ffa000"/></Tip>
                    )}
                  </FlexRow>
                </td>
                <td><PermissionList permissions={scopeToPermissions(grant.scope as Scope[])}/></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageLayout>
  );
}

export async function generateMetadata({ params }: PageProps<'/accounts/shared/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const sharedAccount = await getSharedAccount(id);

  return {
    title: sharedAccount.displayName
      ? `${sharedAccount.displayName} (${sharedAccount.account.accountName})`
      : sharedAccount.account.accountName
  };
}

function hasApiTokenWithRequiredPermissions(apiTokens: { permissions: string[] }[], requiredPermissions: Permission[]): boolean {
  return apiTokens.some((token) => requiredPermissions.every((permission) => token.permissions.includes(permission)));
}
