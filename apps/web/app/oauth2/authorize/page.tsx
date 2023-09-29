/* eslint-disable @next/next/no-img-element */
import { getUser } from '@/lib/getUser';
import { Scope } from '@gw2me/api';
import { redirect } from 'next/navigation';
import layoutStyles from './layout.module.css';
import styles from './page.module.css';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { Icon, IconProp } from '@gw2treasures/ui';
import { FC, ReactNode } from 'react';
import { AuthorizeRequestParams, validateRequest } from './validate';
import { authorize } from './actions';
import { Button, LinkButton } from '@gw2treasures/ui/components/Form/Button';

export default async function AuthorizePage({ searchParams }: { searchParams: AuthorizeRequestParams & Record<string, string> }) {
  const user = await getUser();

  if(!user) {
    const returnBuffer = Buffer.from(`/oauth2/authorize?${new URLSearchParams(searchParams).toString()}`);

    redirect('/login/return?to=' + encodeURIComponent(returnBuffer.toString('base64url')));
  }

  // validate request
  const validatedRequest = await validateRequest(searchParams);

  if(validatedRequest.error !== undefined) {
    return <div style={{ color: 'red' }}>{validatedRequest.error}</div>;
  }

  const application = validatedRequest.application;
  const redirectUri = new URL(searchParams.redirect_uri);

  const authorizeAction = authorize.bind(null, {
    applicationId: application.id,
    redirect_uri: redirectUri.toString(),
    scopes: validatedRequest.scopes,
    state: searchParams.state
  });

  const scopeMap = validatedRequest.scopes.reduce<Partial<Record<Scope, true>>>((map, scope) => ({ ...map, [scope]: true }), {});

  const cancelUrl = new URL(redirectUri);
  cancelUrl.searchParams.set('error', 'access_denied');
  searchParams.state && cancelUrl.searchParams.set('state', searchParams.state);

  return (
    <>
      <div className={layoutStyles.header}>
        <img src={`/api/application/${application.id}/image`} width={64} height={64} className={layoutStyles.image} alt=""/>
        {application.name}
      </div>

      <div>
        {application.name} wants to access the following data of your gw2.me account.
      </div>

      <ul className={styles.scopeList}>
        {scopeMap.identify && <ScopeItem icon="user">Your username <b>{user.name}</b></ScopeItem>}
        {scopeMap.email && <ScopeItem icon="wvw">Your email address</ScopeItem>}
      </ul>

      <div>You can revoke access at anytime from your gw2.me profile.</div>

      <form action={authorizeAction} className={styles.form}>
        <LinkButton href={cancelUrl.toString()} flex className={styles.button}>Cancel</LinkButton>
        <SubmitButton icon="gw2me-outline" type="submit" flex className={styles.authorizeButton}>Authorize {application.name}</SubmitButton>
      </form>

      <div className={styles.redirectNote}>Authorizing will redirect you to <b>{redirectUri.origin}</b></div>
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
