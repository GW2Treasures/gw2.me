/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { Scope } from '@gw2me/client';
import { redirect } from 'next/navigation';
import layoutStyles from './layout.module.css';
import styles from './page.module.css';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { Icon, IconProp } from '@gw2treasures/ui';
import { FC, ReactNode } from 'react';
import { AuthorizeRequestParams, getApplicationByClientId, validateRequest } from './validate';
import { hasGW2Scopes } from '@/lib/scope';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { db } from '@/lib/db';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { authorize } from './actions';
import { Form } from '@/components/Form/Form';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { AuthorizationType } from '@gw2me/database';
import { Expandable } from '@/components/Expandable/Expandable';


export default async function AuthorizePage({ searchParams }: { searchParams: Partial<AuthorizeRequestParams> & Record<string, string> }) {
  // build return url for /account/add?return=X
  const returnUrl = `/oauth2/authorize?${new URLSearchParams(searchParams).toString()}`;

  // validate request
  const { error, request } = await validateRequest(searchParams);

  if(error !== undefined) {
    return <Notice type="error">{error}</Notice>;
  }

  // get current user
  const user = await getUser();

  // redirect to login if user is not logged in
  if(!user) {
    const encodedReturnUrl = Buffer.from(returnUrl).toString('base64url');
    redirect('/login/return?to=' + encodeURIComponent(encodedReturnUrl));
  }

  // declare some variables for easier access
  const application = await getApplicationByClientId(request.client_id);
  const scopes = decodeURIComponent(request.scope).split(' ') as Scope[];
  const scopeMap = scopesToMap(scopes);
  const previousAuthorization = await getPreviousAuthorization(application.id, user.id);
  const previousScope = (previousAuthorization?.scope ?? []) as Scope[];
  const previousScopeMap = scopesToMap(previousScope);
  const previousAccountIds = previousAuthorization?.accounts.map(({ id }) => id) ?? [];
  const redirect_uri = new URL(request.redirect_uri);

  const allPreviouslyAuthorized = scopes.every((scope) => previousScopeMap[scope]);
  if(allPreviouslyAuthorized) {
    // TODO: instantly redirect unless prompt=consent
  }

  // get accounts
  const accounts = hasGW2Scopes(scopes) || hasGW2Scopes(previousScope)
    ? await db.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      })
    : [];

  // build cancel url
  const cancelUrl = createRedirectUrl(redirect_uri, {
    state: request.state,
    error: OAuth2ErrorCode.access_denied,
    error_description: 'user canceled authorization',
  });

  // bind parameters to authorize action
  const authorizeAction = authorize.bind(null, {
    applicationId: application.id,
    redirect_uri: redirect_uri.toString(),
    scopes: Array.from(new Set([...scopes, ...previousScope])),
    state: request.state,
    codeChallenge: request.code_challenge ? `${request.code_challenge_method}:${request.code_challenge}` : undefined,
  });

  return (
    <>
      <div className={layoutStyles.header}>
        <ApplicationImage fileId={application.imageId} size={64}/>
        {application.name}
      </div>
      <Form action={authorizeAction}>
        <div className={styles.form}>
          {!allPreviouslyAuthorized ? (
            <p className={styles.intro}>
              {application.name} wants to access the following {previousAuthorization && 'additional '}data of your gw2.me account.
            </p>
          ) : (
            <p className={styles.intro}>{application.name} wants you tou authorize again.</p>
          )}

          {(!allPreviouslyAuthorized || hasGW2Scopes(scopes)) && (
            <ul className={styles.scopeList}>
              {scopeMap.identify && !previousScopeMap.identify && <ScopeItem icon="user">Your username <b>{user.name}</b></ScopeItem>}
              {scopeMap.email && !previousScopeMap.email && <ScopeItem icon="mail">Your email address</ScopeItem>}
              {hasGW2Scopes(scopes) && (
                <ScopeItem icon="developer">
                  <p className={styles.p}>Access the Guild Wars 2 API with the following permissions</p>
                  <PermissionList permissions={scopes.filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4))}/>
                  <div>Select accounts</div>
                  <div className={styles.accountSelection}>
                    {accounts.map((account) => (
                      <Checkbox key={account.id} defaultChecked={previousAccountIds.includes(account.id)} name="accounts" formValue={account.id}>
                        {account.displayName ? `${account.displayName} (${account.accountName})` : account.accountName}
                      </Checkbox>
                    ))}
                    <LinkButton href={`/accounts/add?return=${encodeURIComponent(returnUrl)}`} appearance="menu" icon="add">Add account</LinkButton>
                  </div>
                </ScopeItem>
              )}
            </ul>
          )}

          {previousAuthorization?.scope && (
            <Expandable label="View previously authorized permissions.">
              <ul className={styles.scopeList}>
                {previousScopeMap.identify && <ScopeItem icon="user">Your username <b>{user.name}</b></ScopeItem>}
                {previousScopeMap.email && <ScopeItem icon="mail">Your email address</ScopeItem>}
                {hasGW2Scopes(previousAuthorization.scope as Scope[]) && !hasGW2Scopes(scopes) && (
                  <ScopeItem icon="developer">
                    <p className={styles.p}>Access the Guild Wars 2 API with the following permissions</p>
                    <PermissionList permissions={previousAuthorization.scope.filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4))}/>
                    <div>Select accounts</div>
                    <div className={styles.accountSelection}>
                      {accounts.map((account) => (
                        <Checkbox key={account.id} defaultChecked={previousAccountIds.includes(account.id)} name="accounts" formValue={account.id}>
                          {account.displayName ? `${account.displayName} (${account.accountName})` : account.accountName}
                        </Checkbox>
                      ))}
                      <LinkButton href={`/accounts/add?return=${encodeURIComponent(returnUrl)}`} appearance="menu" icon="add">Add account</LinkButton>
                    </div>
                  </ScopeItem>
                )}
              </ul>
            </Expandable>
          )}

          <p className={styles.outro}>You can revoke access at anytime from your gw2.me profile.</p>

          <div className={styles.buttons}>
            <LinkButton external href={cancelUrl.toString()} flex className={styles.button}>Cancel</LinkButton>
            <SubmitButton icon="gw2me-outline" type="submit" flex className={styles.authorizeButton}>Authorize {application.name}</SubmitButton>
          </div>

          <div className={styles.redirectNote}>Authorizing will redirect you to <b>{redirect_uri.origin}</b></div>
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

function getPreviousAuthorization(applicationId: string, userId: string) {
  return db.authorization.findFirst({
    where: { applicationId, userId, type: { not: AuthorizationType.Code }},
    include: { accounts: { select: { id: true }}}
  });
}

const emptyScopeMap = Object.fromEntries(Object.values(Scope).map((scope) => [scope, false])) as Record<Scope, boolean>;

function scopesToMap(scopes: Scope[]): Record<Scope, boolean> {
  return scopes.reduce((map, scope) => ({ ...map, [scope]: true }), emptyScopeMap);
}
