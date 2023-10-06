import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { notFound, redirect } from 'next/navigation';
import { deleteApiKey, updateDisplayName } from './actions';
import { Form } from '@/components/Form/Form';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { Code } from '@/components/Layout/Code';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { ApplicationImage } from '@/components/Application/ApplicationImage';

async function getAccount(id: string) {
  const user = await getUser();

  if(!user) {
    redirect('/login');
  }

  const account = await db.account.findUnique({
    where: { id, userId: user.id },
    include: {
      apiTokens: true
    }
  });


  if(!account) {
    notFound();
  }

  const applications = await db.application.findMany({
    select: { id: true, name: true },
    where: { authorizations: { some: { userId: user.id, accounts: { some: { id }}}}}
  });

  return { account, applications };
}

export default async function AccountPage({ params: { id }}: { params: { id: string }}) {
  const { account, applications } = await getAccount(id);

  return (
    <>
      <Headline id="account">{account.accountName}</Headline>

      <Form action={updateDisplayName.bind(null, id)}>
        <Label label="Custom Name">
          <TextInput name="displayName" placeholder={account.accountName} defaultValue={account.displayName ?? ''}/>
        </Label>
        <FlexRow>
          <SubmitButton>Update</SubmitButton>
        </FlexRow>
      </Form>

      <Headline id="api-keys">API Keys</Headline>

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
                <td><PermissionList permissions={token.permissions}/></td>
                <td><Button type="submit" icon="delete" intent="delete" name="id" value={token.id}>Delete</Button></td>
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
              <td><FlexRow><ApplicationImage applicationId={application.id}/> {application.name}</FlexRow></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
