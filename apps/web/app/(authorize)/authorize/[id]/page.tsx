import { getSession, getUser } from '@/lib/session';
import { Scope } from '@gw2me/client';
import layoutStyles from '../../layout.module.css';
import styles from './page.module.css';
import { SubmitButton } from '@gw2treasures/ui/components/Form/Buttons/SubmitButton';
import { Icon, IconProp } from '@gw2treasures/ui';
import { hasGW2Scopes, scopeToPermissions } from '@/lib/scope';
import { cache, FC, ReactNode } from 'react';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';
import { db } from '@/lib/db';
import { Checkbox } from '@gw2treasures/ui/components/Form/Checkbox';
import { PermissionList } from '@/components/Permissions/PermissionList';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { authorize, authorizeInternal, cancelAuthorization } from './actions';
import { Form, FormState } from '@gw2treasures/ui/components/Form/Form';
import { ApplicationImage } from '@/components/Application/ApplicationImage';
import { AuthorizationRequestState, AuthorizationRequestType, SharedAccountState, User, UserEmail } from '@gw2me/database';
import { Expandable } from '@/components/Expandable/Expandable';
import { LoginForm } from 'app/login/form';
import { Metadata } from 'next';
import { Tip } from '@gw2treasures/ui/components/Tip/Tip';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import Link from 'next/link';
import { Select } from '@gw2treasures/ui/components/Form/Select';
import { PageProps } from '@/lib/next';
import { isExpired } from '@/lib/date';
import { AuthorizationRequest } from '../types';
import { normalizeScopes } from 'app/(authorize)/oauth2/authorize/validate';

const getPendingAuthorizationRequest = cache(
  (id: string) => db.authorizationRequest.findUnique({
    where: { id, state: AuthorizationRequestState.Pending },
    include: { client: { include: { application: { include: { owner: true }}}}},
  })
);

export default async function AuthorizePage({ params }: PageProps<{ id: string }>) {
  const { id } = await params;

  const selfUrl = `/authorize/${id}`;

  // get the request
  const authRequest = await getPendingAuthorizationRequest(id) as (AuthorizationRequest & { client: NonNullable<Awaited<ReturnType<typeof getPendingAuthorizationRequest>>>['client'] }) | null;

  if(!authRequest) {
    return <Notice type="error">Authorization request not found.</Notice>;
  }

  if(isExpired(authRequest.expiresAt)) {
    // TODO: allow user to go back to application?
    return <Notice type="error">Authorization request expired.</Notice>;
  }

  const { client } = authRequest;

  // get current user
  const session = await getSession();
  const user = await getUser();

  // declare some variables for easier access
  const previousAuthorization = session ? await getApplicationGrant(client.applicationId, session.userId) : undefined;
  const previousScope = new Set(previousAuthorization?.scope as Scope[]);
  const previousAccountIds = previousAuthorization?.accounts.map(({ id }) => id) ?? [];
  const previousSharedAccountIds = previousAuthorization?.sharedAccounts.map(({ id }) => id) ?? [];
  const scopes = new Set(decodeURIComponent(authRequest.data.scope).split(' ') as Scope[]);

  // normalize the previous scopes
  normalizeScopes(previousScope);

  // if `include_granted_scopes` is set add all previous scopes to the current scopes
  if(authRequest.data.include_granted_scopes) {
    previousScope.forEach((scope) => scopes.add(scope));
  }

  // normalize the current scopes
  normalizeScopes(scopes);

  const verifiedAccountsOnly = scopes.has(Scope.Accounts_Verified) && authRequest.data.verified_accounts_only === 'true';

  // get new/existing scopes
  const newScopes = Array.from(scopes).filter((scope) => !previousScope.has(scope));
  const oldScopes = Array.from(previousScope).filter((scope) => scopes.has(scope));

  // handle prompt!=consent
  // TODO: is this required? This should already be handled in the OAuth2 entrypoint (/oauth2/authorize).
  //   All requests getting here should always show the consent screen.
  const allPreviouslyAuthorized = newScopes.length === 0;
  const canImmediateAuthorize = authRequest.type === AuthorizationRequestType.OAuth2 && authRequest.data.prompt !== 'consent';
  let autoAuthorizeState: FormState | undefined;
  if(allPreviouslyAuthorized && canImmediateAuthorize) {
    autoAuthorizeState = await authorizeInternal(id, previousAccountIds, previousSharedAccountIds, previousAuthorization?.emailId ?? undefined);
  }

  // handle prompt=none
  // TODO: is this required? This should already be handled in the OAuth2 entrypoint (/oauth2/authorize).
  //   All requests with prompt=none should already have been aborted there.
  if(!allPreviouslyAuthorized && authRequest.type === AuthorizationRequestType.OAuth2 && authRequest.data.prompt === 'none') {
    await cancelAuthorization(authRequest.id);
  }

  // get emails
  const emails = user && scopes.has(Scope.Email)
    ? await db.userEmail.findMany({ where: { userId: user.id }, orderBy: { email: 'asc' }})
    : [];

  // get accounts
  const gw2Permissions = Array.from(scopes).filter((scope) => scope.startsWith('gw2:')).map((permission) => permission.substring(4));
  const [accounts, sharedAccounts] = session && scopes.has(Scope.Accounts)
    ? await Promise.all([
        db.account.findMany({
          where: { userId: session.userId },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, accountName: true, displayName: true, verified: true,
            _count: { select: { apiTokens: { where: { permissions: { hasEvery: gw2Permissions }}}}}
          }
        }),
        db.sharedAccount.findMany({
          where: { userId: session.userId, state: SharedAccountState.Active },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            account: { select: { accountName: true, _count: { select: { apiTokens: { where: { permissions: { hasEvery: gw2Permissions }}}}}}}
          }
        })
      ])
    : [[], []];


  // bind parameters to authorize action
  const authorizeAction = authorize.bind(null, id);
  const cancelAction = cancelAuthorization.bind(null, id);

  return (
    <>
      <div className={layoutStyles.header}>
        <ApplicationImage fileId={client.application.imageId} size={64}/>
        <span className={layoutStyles.title}>{client.application.name}</span>
        <span className={layoutStyles.subTitle}>by {client.application.owner.name}</span>
      </div>
      {!session || !user ? (
        <>
          <p className={styles.intro}>To authorize this application, you need to log in first.</p>
          <LoginForm returnTo={selfUrl}/>
          <form action={cancelAction} style={{ display: 'flex' }}>
            <SubmitButton flex appearance="tertiary" className={styles.button}>Cancel</SubmitButton>
          </form>
        </>
      ) : (
        <Form action={authorizeAction} initialState={autoAuthorizeState}>
          <div className={styles.form}>
            {newScopes.length === 0 ? (
              <p className={styles.intro}>{client.application.name} wants to reauthorize access to your gw2.me account.</p>
            ) : oldScopes.length === 0 ? (
              <p className={styles.intro}>{client.application.name} wants to access the following data of your gw2.me account.</p>
            ) : (
              <p className={styles.intro}>{client.application.name} wants to access additional data.</p>
            )}

            {newScopes.length > 0 && renderScopes(newScopes, user, emails, previousAuthorization?.emailId ?? user.defaultEmail?.id, authRequest.id)}

            {oldScopes.length > 0 && (
              <Expandable label="Show previously authorized permissions.">
                {renderScopes(oldScopes, user, emails, previousAuthorization?.emailId ?? user.defaultEmail?.id, authRequest.id)}
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
                  {!verifiedAccountsOnly && sharedAccounts.map((sharedAccount) => (
                    <Checkbox key={sharedAccount.id} defaultChecked={previousSharedAccountIds.includes(sharedAccount.id)} name="sharedAccounts" formValue={sharedAccount.id}>
                      <FlexRow>
                        {sharedAccount.account.accountName} <Tip tip="Shared Account"><Icon icon="share"/></Tip>
                        {sharedAccount.account._count.apiTokens === 0 && (
                          <Tip tip="No API key of this account has all requested permissions">
                            <Icon icon="warning" color="#ffa000"/>
                          </Tip>
                        )}
                      </FlexRow>
                    </Checkbox>
                  ))}
                  <LinkButton href={`/authorize/${authRequest.id}/add-account`} appearance="menu" icon="add">Add account</LinkButton>
                  {!verifiedAccountsOnly && (
                    <div className={styles.tip}>
                      <b>Tip:</b> You can <Link href="/accounts">share your accounts</Link> with your friends to see each other&apos;s accounts.
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className={styles.outro}>
              The above data will be shared with {client.application.name} in accordance with their
              {' '}{client.application.privacyPolicyUrl ? <ExternalLink href={client.application.privacyPolicyUrl}>privacy policy</ExternalLink> : 'privacy policy'} and
              {' '}{client.application.termsOfServiceUrl ? <ExternalLink href={client.application.termsOfServiceUrl}>terms of service</ExternalLink> : 'terms of service'}.
              You can revoke access at anytime from your <Link href="/profile">gw2.me profile</Link>.
            </p>

            <div className={styles.buttons}>
              <Button type="submit" formAction={cancelAction} flex className={styles.button}>Cancel</Button>
              <SubmitButton icon="gw2me-outline" type="submit" flex className={styles.authorizeButton}>Authorize {client.application.name}</SubmitButton>
            </div>

            {(authRequest.type === 'OAuth2' || authRequest.type === 'OAuth2_PAR') && (
              <div className={styles.redirectNote}>Authorizing will redirect you to <b>{new URL(authRequest.data.redirect_uri).origin}</b></div>
            )}
          </div>
        </Form>
      )}
    </>
  );
}

export async function generateMetadata({ params }: PageProps<{ id: string }>): Promise<Metadata> {
  const { id } = await params;
  const authRequest = await getPendingAuthorizationRequest(id);

  return {
    title: `Authorize ${authRequest?.client.application.name}`
  };
}

export interface ScopeItemProps {
  icon: IconProp,
  children: ReactNode,
}

const ScopeItem: FC<ScopeItemProps> = ({ icon, children }) => {
  return <li><Icon icon={icon}/><div>{children}</div></li>;
};

function getApplicationGrant(applicationId: string, userId: string) {
  return db.applicationGrant.findUnique({
    where: { userId_applicationId: { userId, applicationId }},
    include: {
      accounts: { select: { id: true }},
      sharedAccounts: { select: { id: true }},
    }
  });
}

function renderScopes(scopes: Scope[], user: User & { defaultEmail: null | { id: string }}, emails: UserEmail[], emailId: undefined | string, authorizationRequestId: string) {
  return (
    <ul className={styles.scopeList}>
      {scopes.includes(Scope.Identify) && <ScopeItem icon="user">Your username <b>{user.name}</b></ScopeItem>}
      {scopes.includes(Scope.Email) && (
        <ScopeItem icon="mail">
          <p className={styles.p}>Your email address</p>
          <div style={{ marginBlock: 8, display: 'flex', gap: 16 }}>
            {emails.length > 0 && (<Select name="email" options={emails.map(({ id, email }) => ({ label: email, value: id }))} defaultValue={emailId}/>)}
            <LinkButton href={`/authorize/${authorizationRequestId}/add-email`} icon="add">Add Email</LinkButton>
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
          <PermissionList permissions={scopeToPermissions(scopes)}/>
        </ScopeItem>
      )}
    </ul>
  );
}
