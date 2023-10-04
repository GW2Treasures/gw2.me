'use client';

/* eslint-disable @next/next/no-img-element */
import { Scope } from '@gw2me/api';
import layoutStyles from './layout.module.css';
import styles from './page.module.css';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { Icon, IconProp } from '@gw2treasures/ui';
import { FC, ReactNode } from 'react';
import { hasGW2Scopes } from './validate';
import { authorize } from './actions';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Account } from '@gw2me/database';
import { experimental_useFormState as useFormState } from 'react-dom';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';

export interface AuthorizeFormProps {
  application: {
    id: string;
    name: string;
  };
  accounts: Account[];
  userName: string;
  scopes: Scope[]
  redirect_uri: string;
  state?: string;
  cancel_uri: string;
  self_uri: string;
}

export const AuthorizeForm: FC<AuthorizeFormProps> = ({ application, accounts, userName, scopes, redirect_uri, state, cancel_uri, self_uri }) => {
  const redirectUri = new URL(redirect_uri);

  const [formState, action] = useFormState(
    authorize.bind(null, {
      applicationId: application.id,
      redirect_uri: redirectUri.toString(),
      scopes,
      state
    }), {}
  );

  const scopeMap = scopes.reduce<Partial<Record<Scope, true>>>((map, scope) => ({ ...map, [scope]: true }), {});

  return (
    <form action={action} className={styles.form}>
      <div className={layoutStyles.header}>
        <img src={`/api/application/${application.id}/image`} width={64} height={64} className={layoutStyles.image} alt=""/>
        {application.name}
      </div>

      {formState.error && (
        <Notice type="error">{formState.error}</Notice>
      )}

      <div>
        {application.name} wants to access the following data of your gw2.me account.
      </div>

      <ul className={styles.scopeList}>
        {scopeMap.identify && <ScopeItem icon="user">Your username <b>{userName}</b></ScopeItem>}
        {scopeMap.email && <ScopeItem icon="mail">Your email address</ScopeItem>}
        {hasGW2Scopes(scopes) && (
          <ScopeItem icon="developer">
            Access the Guild Wars 2 API with the following permissions
            <PermissionList permissions={scopes.filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4))}/>
            <div>Select accounts</div>
            <div className={styles.accountSelection}>
              {accounts.map((account, index) => (
                <Checkbox key={account.id} defaultChecked={index === 0} name="accounts" formValue={account.id}>
                  {account.displayName ? `${account.displayName} (${account.accountName})` : account.accountName}
                </Checkbox>
              ))}
              <LinkButton href={`/accounts/add?return=${encodeURIComponent(self_uri)}`} appearance="menu" icon="add">Add account</LinkButton>
            </div>
          </ScopeItem>
        )}
      </ul>

      <div>You can revoke access at anytime from your gw2.me profile.</div>

      <div className={styles.buttons}>
        <LinkButton external href={cancel_uri} flex className={styles.button}>Cancel</LinkButton>
        <SubmitButton icon="gw2me-outline" type="submit" flex className={styles.authorizeButton}>Authorize {application.name}</SubmitButton>
      </div>

      <div className={styles.redirectNote}>Authorizing will redirect you to <b>{redirectUri.origin}</b></div>
    </form>
  );
};

export interface ScopeItemProps {
  icon: IconProp
  children: ReactNode;
}

const ScopeItem: FC<ScopeItemProps> = ({ icon, children }) => {
  return <li><Icon icon={icon}/><div>{children}</div></li>;
};

