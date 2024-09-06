'use server';

import { expiresAt } from '@/lib/date';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { isString } from '@gw2treasures/helper/is';
import { generateCode } from '@/lib/token';
import { Authorization, AuthorizationType } from '@gw2me/database';
import { redirect } from 'next/navigation';
import { hasGW2Scopes } from '@/lib/scope';
import { Scope } from '@gw2me/client';
import { FormState } from '@gw2treasures/ui/components/Form/Form';
import { createRedirectUrl } from '@/lib/redirectUrl';
import { cookies } from 'next/headers';
import { userCookie } from '@/lib/cookie';
import { getFormDataString } from '@/lib/form-data';

export interface AuthorizeActionParams {
  applicationId: string,
  redirect_uri: string,
  scopes: Scope[],
  state?: string,
  codeChallenge?: string
}

// eslint-disable-next-line require-await
export async function authorize(params: AuthorizeActionParams, _: FormState, formData: FormData): Promise<FormState> {
  // get account ids from form
  const accountIds = formData.getAll('accounts').filter(isString);

  // get email id from form
  const emailId = getFormDataString(formData, 'email');

  // get session
  const session = await getSession();

  if(session) {
    // make sure user cookie is set for better login flow later
    cookies().set(userCookie(session.userId));
  }

  return authorizeInternal(params, accountIds, emailId);
}

export async function authorizeInternal(
  { applicationId, redirect_uri, scopes, state, codeChallenge }: AuthorizeActionParams,
  accountIds: string[],
  emailId: string | undefined
) {
  // verify at least one account was selected
  if((hasGW2Scopes(scopes) || scopes.includes(Scope.Accounts)) && accountIds.length === 0) {
    return { error: 'At least one account has to be selected.' };
  }

  // verify email was selected
  if(scopes.includes(Scope.Email) && !emailId) {
    return { error: 'Email has to be selected' };
  }

  // get session and verify
  const session = await getSession();

  if(!session) {
    return { error: 'Not logged in' };
  }

  let authorization: Authorization;

  try {
    const identifier = {
      type: AuthorizationType.Code,
      applicationId,
      userId: session.userId
    };

    [, authorization] = await db.$transaction([
      // delete old pending authorization codes for this app
      db.authorization.deleteMany({ where: identifier }),

      // create code authorization in db
      db.authorization.create({
        data: {
          ...identifier,
          scope: scopes,
          redirectUri: redirect_uri,
          codeChallenge,
          token: generateCode(),
          expiresAt: expiresAt(60),
          accounts: { connect: accountIds.map((id) => ({ id })) },
          emailId
        },
      }),
    ]);
  } catch(error) {
    console.log(error);

    return { error: 'Authorization failed' };
  }

  // build redirect url with token and state
  const url = createRedirectUrl(redirect_uri, {
    state,
    code: authorization.token,
  });

  // redirect back to app
  redirect(url.toString());
}
