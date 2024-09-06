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
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { db } from '@/lib/db';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { AuthorizeActionParams, authorize, authorizeInternal } from './actions';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { AuthorizationType, User, UserEmail } from '@gw2me/database';
import { Expandable } from '@/components/Expandable/Expandable';
import { LoginForm } from 'app/login/form';
import { Metadata } from 'next';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import Link from 'next/link';
import { Select } from '@gw2treasures/ui/components/Form/Select';

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
  const previousScope = new Set(previousAuthorization?.scope as Scope[]);
  const previousAccountIds = previousAuthorization?.accounts.map(({ id }) => id) ?? [];
  const scopes = new Set(decodeURIComponent(request.scope).split(' ') as Scope[]);
  const redirect_uri = new URL(request.redirect_uri);

  // normalize the previous scopes
  normalizeScopes(previousScope);

  // if `include_granted_scopes` is set add all previous scopes to the current scopes
  if(request.include_granted_scopes) {
    previousScope.forEach((scope) => scopes.add(scope));
  }

  // normalize the current scopes
  normalizeScopes(scopes);

  const verifiedAccountsOnly = scopes.has(Scope.Accounts_Verified) && request.verified_accounts_only === 'true';

  // get new/existing scopes
  const newScopes = Array.from(scopes).filter((scope) => !previousScope.has(scope));
  const oldScopes = Array.from(previousScope).filter((scope) => scopes.has(scope));

  // build params for the authorize action
  const authorizeActionParams: AuthorizeActionParams = {
    applicationId: application.id,
    redirect_uri: redirect_uri.toString(),
    scopes: Array.from(scopes),
    state: request.state,
    codeChallenge: request.code_challenge ? `${request.code_challenge_method}:${request.code_challenge}` : undefined,
  };

  // handle prompt!=consent
  const allPreviouslyAuthorized = newScopes.length === 0;
  let autoAuthorizeState: FormState | undefined;
  if(allPreviouslyAuthorized && request.prompt !== 'consent') {
    autoAuthorizeState = await authorizeInternal(authorizeActionParams, previousAccountIds, previousAuthorization?.emailId ?? undefined);
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

  // get emails
  const emails = user && scopes.has(Scope.Email)
    ? await db.userEmail.findMany({ where: { userId: user.id }, orderBy: { email: 'asc' }})
    : [];

  // get accounts
  const gw2Permissions = Array.from(scopes).filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4));
  const accounts = session && scopes.has(Scope.Accounts)
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

            {newScopes.length > 0 && renderScopes(newScopes, user, emails, previousAuthorization?.emailId ?? user.defaultEmail?.id)}

            {oldScopes.length > 0 && (
              <Expandable label="Show previously authorized permissions.">
                {renderScopes(oldScopes, user, emails, previousAuthorization?.emailId ?? user.defaultEmail?.id)}
              </Expandable>
            )}

            {scopes.has(Scope.Accounts) && (
              <div className={styles.accountSection}>
                Select Accounts {verifiedAccountsOnly && '(Verified only)'}
                <div className={styles.accountSelection}>
                  {accounts.map((account) => (
                    <Checkbox key={account.id} defaultChecked={previousAccountIds.includes(account.id) && (account.verified || !verifiedAccountsOnly)} name="accounts" formValue={account.id} disabled={!account.verified && verifiedAccountsOnly}>
                      <FlexRow>
                        {account.displayName ? <>{account.displayName} <span style={{ color: 'var(--color-text-muted)' }}>({account.accountName})</span></> : account.accountName}
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

            <p className={styles.outro}>
              The above data will be shared with {application.name} in accordance with their
              {' '}{application.privacyPolicyUrl ? <ExternalLink href={application.privacyPolicyUrl}>privacy policy</ExternalLink> : 'privacy policy'} and
              {' '}{application.termsOfServiceUrl ? <ExternalLink href={application.termsOfServiceUrl}>terms of service</ExternalLink> : 'terms of service'}.
              You can revoke access at anytime from your <Link href="/profile">gw2.me profile</Link>.
            </p>

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

const gw2Scopes = Object.values(Scope).filter((scope) => scope.startsWith('gw2:'));

function normalizeScopes(scopes: Set<Scope>): void {
  // include `accounts` if any gw2 or sub scope is included
  if(gw2Scopes.some((scope) => scopes.has(scope)) || scopes.has(Scope.Accounts_DisplayName) || scopes.has(Scope.Accounts_Verified)) {
    scopes.add(Scope.Accounts);
  }
}

function renderScopes(scopes: Scope[], user: User & { defaultEmail: null | { id: string }}, emails: UserEmail[], emailId: undefined | string) {
  return (
    <ul className={styles.scopeList}>
      {scopes.includes(Scope.Identify) && <ScopeItem icon="user">Your username <b>{user.name}</b></ScopeItem>}
      {scopes.includes(Scope.Email) && (
        <ScopeItem icon="mail">
          <p className={styles.p}>Your email address</p>
          <div style={{ marginBlock: 8, display: 'flex', gap: 16 }}>
            <Select name="email" options={emails.map(({ id, email }) => ({ label: email, value: id }))} defaultValue={emailId}/>
            <LinkButton href="#" icon="add">Add Email</LinkButton>
          </div>
        </ScopeItem>
      )}
      {(scopes.includes(Scope.Accounts_DisplayName) && scopes.includes(Scope.Accounts)) ? (
        <ScopeItem icon="nametag">Your Guild Wars 2 account names and custom display names</ScopeItem>
      ) : scopes.includes(Scope.Accounts) ? (
        <ScopeItem icon="nametag">Your Guild Wars 2 account names</ScopeItem>
      ) : scopes.includes(Scope.Accounts_DisplayName) && (
        <ScopeItem icon="nametag">Custom display names for your Guild Wars 2 accounts</ScopeItem>
      )}
      {scopes.includes(Scope.Accounts_Verified) && <ScopeItem icon="verified">Your Guild Wars 2 account verification status</ScopeItem>}
      {hasGW2Scopes(scopes) && (
        <ScopeItem icon="developer">
          <p className={styles.p}>Read-only access to the Guild Wars 2 API</p>
          <PermissionList permissions={scopes.filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4))}/>
        </ScopeItem>
      )}
    </ul>
  );
}
