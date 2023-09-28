/* eslint-disable @next/next/no-img-element */
import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { Scope } from '@gw2me/api';
import { Application, AuthorizationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { generateCode } from '@/lib/token';
import styles from './layout.module.css';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';

interface Params {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  scope: string;
  state: string;
}

async function validateRequest(params: Params): Promise<{ error: string, application?: undefined } | { error: undefined, application: Application, scopes: Scope[] }> {
  const supportedResponseTypes = ['code'];

  if(!params.response_type || !supportedResponseTypes.includes(params.response_type)) {
    return { error: 'Invalid response_type' };
  }

  if(!params.redirect_uri) {
    return { error: 'Invalid redirect_uri' };
  }

  if(!params.client_id) {
    return { error: 'Invalid client_id' };
  }

  if(!params.client_id) {
    return { error: 'Invalid client_id' };
  }

  const scopes = decodeURIComponent(params.scope).split(' ');

  if(!params.scope || !validScopes(scopes)) {
    return { error: 'Invalid scope' };
  }

  const application = await db.application.findUnique({ where: { clientId: params.client_id }});

  if(!application) {
    return { error: 'Invalid client_id' };
  }

  if(!application.callbackUrls.includes(params.redirect_uri)) {
    return { error: 'Invalid redirect_uri' };
  }

  return { error: undefined, application, scopes };
}

function validScopes(scopes: string[]): scopes is Scope[] {
  const validScopes: string[] = Object.values(Scope);
  return scopes.every((scope) => validScopes.includes(scope));
}

async function authorize({ applicationId, redirect_uri, scopes, state }: { applicationId: string, redirect_uri: string, scopes: string[], state?: string }) {
  'use server';

  const user = await getUser();

  if(!applicationId || !redirect_uri || !user) {
    throw new Error();
  }

  const type = AuthorizationType.Code;
  const userId = user.id;

  const authorization = await db.authorization.upsert({
    where: { type_applicationId_userId: { type, applicationId, userId }},
    create: {
      type, applicationId, userId, scope: scopes,
      token: generateCode(),
      expiresAt: expiresAt(60),
    },
    update: {
      expiresAt: expiresAt(60),
    }
  });

  const url = new URL(redirect_uri);
  url.searchParams.set('code', authorization.token);
  state && url.searchParams.set('state', state);

  redirect(url.toString());
};

export default async function AuthorizePage({ searchParams }: { searchParams: Params & Record<string, string> }) {
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

  const authorizeAction = authorize.bind(null, {
    applicationId: application.id,
    redirect_uri: searchParams.redirect_uri,
    scopes: validatedRequest.scopes,
    state: searchParams.state
  });

  return (
    <>
      <div className={styles.header}>
        <img src={`/api/application/${application.id}/image`} width={64} height={64} className={styles.image} alt=""/>
        {application.name}
      </div>
      <div>
        {application.name} wants to access your gw2.me account.
      </div>

      <form action={authorizeAction} style={{ display: 'flex' }}>
        <SubmitButton icon="gw2me-outline" type="submit" flex>Authorize</SubmitButton>
      </form>
    </>
  );
}
