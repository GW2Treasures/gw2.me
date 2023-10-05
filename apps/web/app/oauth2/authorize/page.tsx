/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { Scope } from '@gw2me/api';
import { redirect } from 'next/navigation';
import layoutStyles from './layout.module.css';
import styles from './page.module.css';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { Icon, IconProp } from '@gw2treasures/ui';
import { FC, ReactNode } from 'react';
import { AuthorizeRequestParams, hasGW2Scopes, validateRequest } from './validate';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { db } from '@/lib/db';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { authorize } from './actions';
import { Form } from '@/components/Form/Form';
import { ApplicationImage } from '@/components/Application/ApplicationImage';


export default async function AuthorizePage({ searchParams }: { searchParams: AuthorizeRequestParams & Record<string, string> }) {
  // build return url for /account/add?return=X
  const returnUrl = `/oauth2/authorize?${new URLSearchParams(searchParams).toString()}`;

  // validate request
  const validatedRequest = await validateRequest(searchParams);

  if(validatedRequest.error !== undefined) {
    return <Notice type="error">{validatedRequest.error}</Notice>;
  }

  // get current user
  const user = await getUser();

  // redirect to login if user is not logged in
  if(!user) {
    const encodedReturnUrl = Buffer.from(returnUrl).toString('base64url');
    redirect('/login/return?to=' + encodeURIComponent(encodedReturnUrl));
  }

  // get accounts
  const accounts = hasGW2Scopes(validatedRequest.scopes)
    ? await db.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      })
    : [];

  // build cancel url
  const cancelUrl = new URL(validatedRequest.redirect_uri);
  cancelUrl.searchParams.set('error', 'access_denied');
  searchParams.state && cancelUrl.searchParams.set('state', searchParams.state);

  // declare some variables for easier access
  const application = validatedRequest.application;
  const scopes = validatedRequest.scopes;
  const scopeMap = scopes.reduce<Partial<Record<Scope, true>>>((map, scope) => ({ ...map, [scope]: true }), {});

  // bind parameters to authorize action
  const authorizeAction = authorize.bind(null, {
    applicationId: application.id,
    redirect_uri: validatedRequest.redirect_uri.toString(),
    scopes,
    state: searchParams.state
  });

  return (
    <>
      <div className={layoutStyles.header}>
        <ApplicationImage applicationId={application.id} size={64}/>
        {application.name}
      </div>
      <Form action={authorizeAction}>
        <div className={styles.form}>
          <div>
            {application.name} wants to access the following data of your gw2.me account.
          </div>

          <ul className={styles.scopeList}>
            {scopeMap.identify && <ScopeItem icon="user">Your username <b>{user.name}</b></ScopeItem>}
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
                  <LinkButton href={`/accounts/add?return=${encodeURIComponent(returnUrl)}`} appearance="menu" icon="add">Add account</LinkButton>
                </div>
              </ScopeItem>
            )}
          </ul>

          <div>You can revoke access at anytime from your gw2.me profile.</div>

          <div className={styles.buttons}>
            <LinkButton external href={cancelUrl.toString()} flex className={styles.button}>Cancel</LinkButton>
            <SubmitButton icon="gw2me-outline" type="submit" flex className={styles.authorizeButton}>Authorize {application.name}</SubmitButton>
          </div>

          <div className={styles.redirectNote}>Authorizing will redirect you to <b>{validatedRequest.redirect_uri.origin}</b></div>
        </div>
      </Form>
    </>
  );
}

export interface ScopeItemProps {
  icon: IconProp
  children: ReactNode;
}

const ScopeItem: FC<ScopeItemProps> = ({ icon, children }) => {
  return <li><Icon icon={icon}/><div>{children}</div></li>;
};
