import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { db } from '@/lib/db';
import { getSessionOrRedirect } from '@/lib/session';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { notFound } from 'next/navigation';
import { deleteApiKey, updateDisplayName } from './actions';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Code } from '@/components/Layout/Code';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { PageLayout } from '@/components/Layout/PageLayout';
import { cache } from 'react';
import { PageProps } from '@/lib/next';
import { Permission } from '@gw2api/types/data/tokeninfo';

const getAccount = cache(async function getAccount(id: string) {
  const session = await getSessionOrRedirect();

  const account = await db.account.findUnique({
    where: { id, userId: session.userId },
    include: {
      apiTokens: true
    }
  });

  if(!account) {
    notFound();
  }

  return account;
});

const getApplications = cache(function getApplications(accountId: string, userId: string) {
  return db.application.findMany({
    select: { id: true, name: true, imageId: true },
    where: { clients: { some: { authorizations: { some: { userId, accounts: { some: { id: accountId }}}}}}}
  });
});

type AccountPageProps = PageProps<{ id: string }>;

export default async function AccountPage({ params }: AccountPageProps) {
  const { id } = await params;
  const account = await getAccount(id);
  const applications = await getApplications(account.id, account.userId);

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
                    <Code inline borderless>{token.token}</Code>
                    <Tip tip="Copy API Key">
                      <CopyButton iconOnly icon="copy" copy={token.token} appearance="tertiary"/>
                    </Tip>
                  </FlexRow>
                </td>
                <td><PermissionList permissions={token.permissions as Permission[]}/></td>
                <td><Button type="submit" icon="delete" intent="delete" name="apiKeyId" value={token.id}>Delete</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Form>

      <Headline id="applications">Authorized Applications</Headline>
      <Table>
        <thead>
          <tr>
            <Table.HeaderCell>Name</Table.HeaderCell>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id}>
              <td><FlexRow><ApplicationImage fileId={application.imageId}/> {application.name}</FlexRow></td>
            </tr>
          ))}
        </tbody>
      </Table>
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
