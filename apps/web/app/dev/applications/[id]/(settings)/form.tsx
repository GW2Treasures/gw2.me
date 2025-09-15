'use client';

import { useActionState, useCallback, type FC } from 'react';
import Link from 'next/link';
import { Textarea } from '@/components/Textarea/Textarea';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Label } from '@gw2treasures/ui/components/Form/Label';
import { TextInput } from '@gw2treasures/ui/components/Form/TextInput';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Select, SelectProps } from '@gw2treasures/ui/components/Form/Select';
import type { Application, UserEmail } from '@gw2me/database';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { FormState } from '@gw2treasures/ui/components/Form/Form';

export interface ApplicationFormProps {
  applicationId: string,
  application: Application,
  emails: UserEmail[],
  editApplicationAction: (state: FormState, data: FormData) => Promise<FormState>,
}

export const ApplicationForm: FC<ApplicationFormProps> = ({ applicationId, application, emails, editApplicationAction }) => {
  const [editState, editAction, isPending] = useActionState(editApplicationAction, {}, `/dev/applications/${applicationId}`);
  const emailOptions: SelectProps['options'] = emails.map((email) => ({ value: email.id, label: email.email }));

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Label label="Image">
            <input type="file" name="image"/>
          </Label>

          <Label label="Name">
            <TextInput name="name" defaultValue={application.name} value={undefined} readOnly={isPending}/>
          </Label>

          <Label label="Description">
            <Textarea name="description" defaultValue={application.description} readOnly={isPending}/>
          </Label>

          <Label label="Contact Email">
            {null}
            <Select name="email" options={[{ label: '', value: '' }, ...emailOptions]} defaultValue={application.emailId ?? undefined}/>
          </Label>

          <Label label="Public">
            <Checkbox name="public" defaultChecked={application.public} disabled={isPending}>
              Show on <Link href="/discover">Discover</Link> page
            </Checkbox>
          </Label>

          <Label label="Public URL">
            <TextInput name="publicUrl" defaultValue={application.publicUrl} value={undefined} readOnly={isPending}/>
          </Label>

          <Label label="Privacy Policy URL">
            <TextInput name="privacyPolicyUrl" defaultValue={application.privacyPolicyUrl} value={undefined} readOnly={isPending}/>
          </Label>

          <Label label="Terms of Service URL">
            <TextInput name="termsOfServiceUrl" defaultValue={application.termsOfServiceUrl} value={undefined} readOnly={isPending}/>
          </Label>
        </div>
      </form>

      <FlexRow wrap>
        <Button type="submit" form="edit" disabled={isPending} icon={isPending ? 'loading' : undefined}>Save</Button>
        <LinkButton href={`/dev/applications/${application.id}/delete`} icon="delete">Delete Application</LinkButton>
      </FlexRow>
    </>
  );
};
