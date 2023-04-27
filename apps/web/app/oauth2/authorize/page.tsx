import { ActionForm } from '@/components/ActionForm/ActionForm';
import { action } from '@/lib/action';
import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getUser } from '@/lib/getUser';
import { Application, AuthorizationType } from '@gw2me/database';
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';

interface Params {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  scope: string;
  state: string;
}

async function validateRequest(params: Params): Promise<{ error: string, application?: undefined } | { error: undefined, application: Application }> {
  const supportedResponseTypes = ['code'];
  const supportedScopes = ['identify', 'email', 'accounts', 'accounts.create'];

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

  if(!params.scope || !decodeURIComponent(params.scope).split(' ').every((scope) => supportedScopes.includes(scope))) {
    return { error: 'Invalid scope' };
  }

  const application = await db.application.findUnique({ where: { clientId: params.client_id }});

  if(!application) {
    return { error: 'Invalid client_id' };
  }

  if(!application.callbackUrls.includes(params.redirect_uri)) {
    return { error: 'Invalid redirect_uri' };
  }

  return { error: undefined, application };
}

const authorize = action(async (data) => {
  'use server';

  const applicationId = data.get('applicationId')?.toString();
  const redirect_uri = data.get('redirect_uri')?.toString();
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
      type, applicationId, userId,
      token: randomBytes(16).toString('hex'),
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
    <div>
      {application.name} wants to access your gw2.me account.

      <ActionForm action={authorize}>
        <input type="hidden" name="applicationId" value={application.id}/>
        <input type="hidden" name="redirect_uri" value={searchParams.redirect_uri}/>
        {searchParams.state && <input type="hidden" name="state" value={searchParams.state}/>}
        <button>Authorize</button>
      </ActionForm>
    </div>
  );
}
