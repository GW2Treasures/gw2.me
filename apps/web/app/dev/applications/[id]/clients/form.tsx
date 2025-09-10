'use client';

import { useActionState, useCallback, type FC } from 'react';
import { Textarea } from '@/components/Textarea/Textarea';
import type { GenerateClientSecretFormState } from './_actions/secret';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { CopyButton } from '@gw2treasures/ui/components/Form/Buttons/CopyButton';
import type { Client, ClientSecret } from '@gw2me/database';
import { ClientType } from '@gw2me/database/enums';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { Table } from '@gw2treasures/ui/components/Table/Table';
import { Icon } from '@gw2treasures/ui';
import { FormatDate } from '@/components/Format/FormatDate';
import { Gw2MeClient, Scope } from '@gw2me/client';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { useHydrated } from '@/lib/use-hydrated';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';

export interface ApplicationFormProps {
  applicationId: string;
  client: Client & { secrets: Pick<ClientSecret, 'id' | 'createdAt' | 'usedAt'>[] };
  editApplicationAction: (state: FormState, data: FormData) => Promise<FormState>;
  generateClientSecretAction: (state: GenerateClientSecretFormState, data: FormData) => Promise<GenerateClientSecretFormState>;
  deleteClientSecretAction: (state: FormState, data: FormData) => Promise<FormState>;
}

export const ClientForm: FC<ApplicationFormProps> = ({ applicationId, client, editApplicationAction, generateClientSecretAction, deleteClientSecretAction }) => {
  const selfUrl = `/dev/applications/${applicationId}/clients/${client.id}`;

  const [editState, editAction, isEditPending] = useActionState(editApplicationAction, {}, selfUrl);
  const [generateSecretState, generateSecretAction, isGenerateSecretPending] = useActionState(generateClientSecretAction, {}, selfUrl);
  const [deleteSecretState, deleteSecretAction, isDeleteSecretPending] = useActionState(deleteClientSecretAction, {}, selfUrl);

  const isPending = isEditPending || isGenerateSecretPending || isDeleteSecretPending;

  const isHydrated = useHydrated();

  const showNotice = useCallback((notice: HTMLElement | null) => {
    if(!isPending) {
      notice?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isPending]);

  return (
    <>
      <form id="edit" action={editAction}>
        {editState.success && <Notice ref={showNotice} key={crypto.randomUUID()}>{editState.success}</Notice>}
        {editState.error && <Notice type="error" ref={showNotice} key={crypto.randomUUID()}>{editState.error}</Notice>}
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Label label="Name">
          <TextInput name="name" defaultValue={client.name} form="edit"/>
        </Label>

        <Label label="Type">
          <TextInput readOnly value={client.type}/>
        </Label>

        <Label label="Client ID">
          <TextInput value={client.id} readOnly/>
          {isHydrated && <CopyButton copy={client.id} icon="copy">Copy</CopyButton>}
        </Label>

        {client.type === ClientType.Confidential && (
          <>
            <FlexRow align="space-between">
              <div>Client Secret</div>
              <form action={generateSecretAction}>
                <SubmitButton disabled={isPending || client.secrets.length >= 10} icon="key-add" name="clientId" value={client.id}>Generate Client Secret</SubmitButton>
              </form>
            </FlexRow>

            {generateSecretState.success && <Notice ref={showNotice} key={crypto.randomUUID()}>{generateSecretState.success}</Notice>}
            {generateSecretState.error && <Notice type="error" ref={showNotice} key={crypto.randomUUID()}>{generateSecretState.error}</Notice>}
            {deleteSecretState.success && <Notice ref={showNotice} key={crypto.randomUUID()}>{deleteSecretState.success}</Notice>}
            {deleteSecretState.error && <Notice type="error" ref={showNotice} key={crypto.randomUUID()}>{deleteSecretState.error}</Notice>}

            {client.secrets.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <Table.HeaderCell>Client Secret</Table.HeaderCell>
                    <Table.HeaderCell small>Last Used At</Table.HeaderCell>
                    <Table.HeaderCell small>Actions</Table.HeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {client.secrets.map((secret) => (
                    <tr key={secret.id} style={secret.id === generateSecretState.clientSecret?.id ? { backgroundColor: 'var(--color-background-green)' } : undefined}>
                      {secret.id === generateSecretState.clientSecret?.id ? (
                        <td><FlexRow><Icon icon="key"/><TextInput readOnly value={generateSecretState.clientSecret.secret}/>{isHydrated && <CopyButton copy={generateSecretState.clientSecret.secret} icon="copy">Copy</CopyButton>}</FlexRow></td>
                      ) : (
                        <td><FlexRow><Icon icon="key"/><span>Generated at <FormatDate date={secret.createdAt}/></span></FlexRow></td>
                      )}
                      <td style={{ whiteSpace: 'nowrap' }}>{secret.usedAt ? <FormatDate date={secret.usedAt}/> : 'never'}</td>
                      <td>
                        <form action={deleteSecretAction}>
                          <SubmitButton disabled={isPending || client.secrets.length === 1} icon="delete" intent="delete" name="clientSecretId" value={secret.id}>Delete</SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div style={{ background: 'var(--color-background-light)', padding: 16, borderRadius: 2, textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-dark)' }}>No client secrets added yet</div>
            )}
          </>
        )}

        <Label label="Redirect URLs">
          <Textarea name="callbackUrls" defaultValue={client.callbackUrls.join('\n')} form="edit"/>
        </Label>
      </div>

      <FlexRow wrap>
        <Button type="submit" form="edit" disabled={isPending} icon={isEditPending ? 'loading' : undefined}>Save</Button>
        <LinkButton target="_blank" href={new Gw2MeClient({ client_id: client.id }, { url: 'http://placeholder/' }).getAuthorizationUrl({ redirect_uri: client.callbackUrls[0], scopes: [Scope.Identify], prompt: 'consent', include_granted_scopes: true }).replace('http://placeholder/', '/')}>Test Link <Icon icon="external"/></LinkButton>
        <LinkButton icon="delete" href={`${selfUrl}/delete`}>Delete Client</LinkButton>
      </FlexRow>
    </>
  );
};
