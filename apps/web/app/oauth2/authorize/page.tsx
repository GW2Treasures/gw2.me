/* eslint-disable @next/next/no-img-element */
import { ActionForm } from '@/components/ActionForm/ActionForm';
import { action } from '@/lib/action';
import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { Scope } from '@gw2me/api';
import { Application, AuthorizationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { generateCode } from '@/lib/token';
import styles from './layout.module.css';

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

const authorize = action(async (data) => {
  'use server';

  const applicationId = data.get('applicationId')?.toString();
  const redirect_uri = data.get('redirect_uri')?.toString();
  const scopes = data.get('scope')?.toString().split(' ');
  const state = data.get('state')?.toString();
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
});

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

  return (
    <>
      <div className={styles.header}>
        <img src={`/api/application/${application.id}/image`} width={64} height={64} className={styles.image} alt=""/>
        {application.name}
      </div>
      <div>
        {application.name} wants to access your gw2.me account.
      </div>

      <ActionForm action={authorize}>
        <input type="hidden" name="applicationId" value={application.id}/>
        <input type="hidden" name="redirect_uri" value={searchParams.redirect_uri}/>
        <input type="hidden" name="scope" value={validatedRequest.scopes.join(' ')}/>
        {searchParams.state && <input type="hidden" name="state" value={searchParams.state}/>}
        <Button>Authorize</Button>
      </ActionForm>
    </>
  );
}
