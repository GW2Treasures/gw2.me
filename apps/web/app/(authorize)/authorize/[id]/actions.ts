'use server';

import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { isString } from '@gw2treasures/helper/is';
import { generateCode } from '@/lib/token';
import { Authorization, AuthorizationRequestState, AuthorizationRequestType, AuthorizationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { hasGW2Scopes } from '@/lib/scope';
import { Scope } from '@gw2me/client';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { cookies } from 'next/headers';
import { userCookie } from '@/lib/cookie';
import { getFormDataString } from '@/lib/form-data';
import { cancelAuthorizationRequest } from '../helper';
import { AuthorizationRequest } from '../types';
import { OAuth2ErrorCode } from '@/lib/oauth/error';
import { notExpired } from '@/lib/db/helper';

export interface AuthorizeActionParams {
  clientId: string,
  redirect_uri: string,
  scopes: Scope[],
  state?: string,
  codeChallenge?: string
}

// eslint-disable-next-line require-await
export async function authorize(id: string, _: FormState, formData: FormData): Promise<FormState> {
  // get account ids from form
  const accountIds = formData.getAll('accounts').filter(isString);

  // get email id from form
  const emailId = getFormDataString(formData, 'email');

  // get session
  const session = await getSession();

  if(session) {
    // make sure user cookie is set for better login flow later
    const cookieStore = await cookies();
    cookieStore.set(await userCookie(session.userId));
  }

  return authorizeInternal(id, accountIds, emailId);
}

export async function authorizeInternal(
  id: string,
  accountIds: string[],
  emailId: string | undefined | null
): Promise<{ error: string }> {
  // get authorization request
  const authorizationRequest = await db.authorizationRequest.findUnique({
    where: { id, state: 'Pending', ...notExpired },
    include: { client: { select: { applicationId: true }}}
  }) as (AuthorizationRequest & ({ client: { applicationId: string }})) | null;

  if(!authorizationRequest) {
    return { error: 'Authorization request not found' };
  }


  // get session and verify
  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }


  // unique "applicationGrant" identifier
  const applicationGrantIdentifier = {
    userId_applicationId: { userId: session.userId, applicationId: authorizationRequest.client.applicationId }
  };


  // get scopes
  const scopes = authorizationRequest.data.scope.split(' ') as Scope[];

  // include previously granted scopes
  if(authorizationRequest.data.include_granted_scopes) {
    // get app grant
    const appGrant = await db.applicationGrant.findUnique({
      select: { scope: true },
      where: applicationGrantIdentifier
    });

    // add scopes
    appGrant?.scope.forEach((scope) => {
      if(!scopes.includes(scope as Scope)) {
        scopes.push(scope as Scope);
      }
    });
  }


  // verify at least one account was selected
  if((hasGW2Scopes(scopes) || scopes.includes(Scope.Accounts)) && accountIds.length === 0) {
    return { error: 'At least one account has to be selected.' };
  }


  // verify email was selected
  if(scopes.includes(Scope.Email) && !emailId) {
    return { error: 'Email has to be selected' };
  }


  let authorization: Authorization;

  try {
    const identifier = {
      type: AuthorizationType.Code,
      clientId: authorizationRequest.clientId,
      userId: session.userId
    };

    [,, authorization] = await db.$transaction([
      // delete old pending authorization codes for this app
      db.authorization.deleteMany({ where: identifier }),

      // create or update applicationGrant
      db.applicationGrant.upsert({
        where: applicationGrantIdentifier,
        create: {
          ...applicationGrantIdentifier.userId_applicationId,
          scope: scopes,
          accounts: { connect: accountIds.map((id) => ({ id })) },
          emailId,
        },
        update: {
          scope: scopes,
          accounts: { set: accountIds.map((id) => ({ id })) },
          emailId
        }
      }),

      // create code authorization in db
      db.authorization.create({
        data: {
          ...identifier,
          applicationId: authorizationRequest.client.applicationId,
          scope: scopes,
          redirectUri: authorizationRequest.type === 'OAuth2' ? authorizationRequest.data.redirect_uri : undefined,
          codeChallenge: authorizationRequest.data.code_challenge_method ? `${authorizationRequest.data.code_challenge_method}:${authorizationRequest.data.code_challenge}` : null,
          token: generateCode(),
          expiresAt: expiresAt(60),
        },
      }),

      // set pending authorization request to authorized
      db.authorizationRequest.update({
        where: { id },
        data: {
          state: AuthorizationRequestState.Authorized,
          userId: session.userId,
        },
      }),
    ]);
  } catch(error) {
    console.log(error);

    return { error: 'Authorization failed' };
  }

  switch(authorizationRequest.type) {
    case AuthorizationRequestType.OAuth2:
    case AuthorizationRequestType.OAuth2_PAR: {
      // create redirect url for app
      const url = await createRedirectUrl(authorizationRequest.data.redirect_uri, {
        state: authorizationRequest.data.state,
        code: authorization.token,
      });

      // redirect back to app
      return redirect(url.toString());
    }

    case AuthorizationRequestType.FedCM: {
      // redirect user to page that calls `IdentityProvider.resolve(code)`
      return redirect(`/fed-cm/authorize?code=${encodeURIComponent(authorization.token)}`);
    }
  }
}

export async function cancelAuthorization(id: string) {
  // set the authorization request to canceled so it can't be used anymore
  const authRequest = await cancelAuthorizationRequest(id);

  // redirect user
  switch(authRequest.type) {
    case AuthorizationRequestType.OAuth2:
    case AuthorizationRequestType.OAuth2_PAR: {
      const data = authRequest.data;

      // create redirect url for app
      const cancelUrl = await createRedirectUrl(data.redirect_uri, {
        state: data.state,
        error: OAuth2ErrorCode.access_denied,
        error_description: 'user canceled authorization',
      });

      // redirect back to app
      return redirect(cancelUrl.toString());
    }

    case AuthorizationRequestType.FedCM: {
      // redirecting the user to /fed-cm/authorize without a code query parameter will call `IdentityProvider.close()`
      return redirect('/fed-cm/authorize');
    }
  }
}
