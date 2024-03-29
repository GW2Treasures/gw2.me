import { getSession, getUser } from '@/lib/session';
import { Scope } from '@gw2me/client';
import { redirect } from 'next/navigation';
import layoutStyles from './layout.module.css';
import styles from './page.module.css';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Icon, IconProp } from '@gw2treasures/ui';
import { FC, ReactNode } from 'react';
import { AuthorizeRequestParams, getApplicationByClientId, validateRequest } from './validate';
import { hasGW2Scopes } from '@/lib/scope';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { db } from '@/lib/db';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { AuthorizeActionParams, authorize, authorizeInternal } from './actions';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { AuthorizationType, User } from '@gw2me/database';
import { Expandable } from '@/components/Expandable/Expandable';
import { LoginForm } from 'app/login/form';
import { Metadata } from 'next';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';

interface AuthorizePageProps {
  searchParams: Partial<AuthorizeRequestParams> & Record<string, string>
}

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  // build return url for /account/add?return=X
  const returnUrl = `/oauth2/authorize?${new URLSearchParams(searchParams).toString()}`;

  // validate request
  const { error, request } = await validateRequest(searchParams);

  if(error !== undefined) {
    return <Notice type="error">{error}</Notice>;
  }

  // get current user
  const session = await getSession();
  const user = await getUser();

  // declare some variables for easier access
  const application = await getApplicationByClientId(request.client_id);
  const previousAuthorization = session ? await getPreviousAuthorization(application.id, session.userId) : undefined;
  const previousScope = (previousAuthorization?.scope ?? []) as Scope[];
  const previousScopeMap = scopesToMap(previousScope);
  const previousAccountIds = previousAuthorization?.accounts.map(({ id }) => id) ?? [];
  const scopes = decodeURIComponent(request.scope).split(' ') as Scope[];
  const verifiedAccountsOnly = request.verified_accounts_only === 'true';

  if(request.include_granted_scopes) {
    previousScope.forEach((scope) => {
      if(!scopes.includes(scope)) {
        scopes.push(scope);
      }
    });
  }

  const scopeMap = scopesToMap(scopes);
  const redirect_uri = new URL(request.redirect_uri);
  const newScopes = scopes.filter((scope) => !previousScopeMap[scope]);
  const oldScopes = previousScope.filter((scope) => scopeMap[scope]);

  const authorizeActionParams: AuthorizeActionParams = {
    applicationId: application.id,
    redirect_uri: redirect_uri.toString(),
    scopes,
    state: request.state,
    codeChallenge: request.code_challenge ? `${request.code_challenge_method}:${request.code_challenge}` : undefined,
  };

  // handle prompt!=consent
  const allPreviouslyAuthorized = newScopes.length === 0;
  let autoAuthorizeState: FormState | undefined;
  if(allPreviouslyAuthorized && request.prompt !== 'consent') {
    autoAuthorizeState = await authorizeInternal(authorizeActionParams, previousAccountIds);
  }

  // handle prompt=none
  if(!allPreviouslyAuthorized && request.prompt === 'none') {
    const errorUrl = createRedirectUrl(redirect_uri, {
      state: request.state,
      error: OAuth2ErrorCode.access_denied,
      error_description: 'user not previously authorized',
    });

    redirect(errorUrl.toString());
  }

  // get accounts
  const gw2Permissions = scopes.filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4));
  const accounts = session && hasGW2Scopes(scopes)
    ? await db.account.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, accountName: true, displayName: true, verified: true,
          _count: { select: { apiTokens: { where: { permissions: { hasEvery: gw2Permissions }}}}}
        }
      })
    : [];

  // build cancel url
  const cancelUrl = createRedirectUrl(redirect_uri, {
    state: request.state,
    error: OAuth2ErrorCode.access_denied,
    error_description: 'user canceled authorization',
  });

  // bind parameters to authorize action
  const authorizeAction = authorize.bind(null, authorizeActionParams);

  return (
    <>
      <div className={layoutStyles.header}>
        <ApplicationImage fileId={application.imageId} size={64}/>
        <span className={layoutStyles.title}>{application.name}</span>
        <span className={layoutStyles.subTitle}>by {application.owner.name}</span>
      </div>
      {!session || !user ? (
        <>
          <p className={styles.intro}>To authorize this application, you need to log in first.</p>
          <LoginForm returnTo={returnUrl}/>
          <LinkButton external href={cancelUrl.toString()} flex appearance="tertiary" className={styles.button}>Cancel</LinkButton>
        </>
      ) : (
        <Form action={authorizeAction} initialState={autoAuthorizeState}>
          <div className={styles.form}>
            {newScopes.length === 0 ? (
              <p className={styles.intro}>{application.name} wants to reauthorize access to your gw2.me account.</p>
            ) : oldScopes.length === 0 ? (
              <p className={styles.intro}>{application.name} wants to access the following data of your gw2.me account.</p>
            ) : (
              <p className={styles.intro}>{application.name} wants to access additional data.</p>
            )}

            {newScopes.length > 0 && renderScopes(newScopes, user)}

            {oldScopes.length > 0 && (
              <Expandable label="Show previously authorized permissions.">
                {renderScopes(oldScopes, user)}
              </Expandable>
            )}

            {hasGW2Scopes(scopes) && (
              <div className={styles.accountSection}>
                Select Accounts {verifiedAccountsOnly && '(Verified only)'}
                <div className={styles.accountSelection}>
                  {accounts.map((account) => (
                    <Checkbox key={account.id} defaultChecked={previousAccountIds.includes(account.id) && (account.verified || request.verified_accounts_only !== 'true')} name="accounts" formValue={account.id} disabled={!account.verified && request.verified_accounts_only === 'true'}>
                      <FlexRow>
                        {account.displayName ? `${account.displayName} (${account.accountName})` : account.accountName}
                        {verifiedAccountsOnly && !account.verified && (<Tip tip="Not verified"><Icon icon="unverified"/></Tip>)}
                        {!verifiedAccountsOnly && account.verified && (<Tip tip="Verified"><Icon icon="verified"/></Tip>)}
                        {account._count.apiTokens === 0 && (
                          <Tip tip="No API key of this account has all requested permissions">
                            <Icon icon="warning" color="#ffa000"/>
                          </Tip>
                        )}
                      </FlexRow>
                    </Checkbox>
                  ))}
                  <LinkButton href={`/accounts/add?return=${encodeURIComponent(returnUrl)}`} appearance="menu" icon="add">Add account</LinkButton>
                </div>
              </div>
            )}

            <p className={styles.outro}>You can revoke access at anytime from your gw2.me profile.</p>

            <div className={styles.buttons}>
              <LinkButton external href={cancelUrl.toString()} flex className={styles.button}>Cancel</LinkButton>
              <SubmitButton icon="gw2me-outline" type="submit" flex className={styles.authorizeButton}>Authorize {application.name}</SubmitButton>
            </div>

            <div className={styles.redirectNote}>Authorizing will redirect you to <b>{redirect_uri.origin}</b></div>
          </div>
        </Form>
      )}
    </>
  );
}

export async function generateMetadata({ searchParams }: AuthorizePageProps): Promise<Metadata> {
  const { error, request } = await validateRequest(searchParams);

  if(error !== undefined) {
    return {
      title: error
    };
  }

  const application = await getApplicationByClientId(request.client_id);

  return {
    title: `Authorize ${application.name}`
  };
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

function renderScopes(scopes: Scope[], user: User) {
  return (
    <ul className={styles.scopeList}>
      {scopes.includes(Scope.Identify) && <ScopeItem icon="user">Your username <b>{user.name}</b></ScopeItem>}
      {scopes.includes(Scope.Email) && <ScopeItem icon="mail">Your email address</ScopeItem>}
      {hasGW2Scopes(scopes) && (
        <ScopeItem icon="developer">
          <p className={styles.p}>Read-only access to the Guild Wars 2 API</p>
          <PermissionList permissions={scopes.filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4))}/>
        </ScopeItem>
      )}
    </ul>
  );
}
