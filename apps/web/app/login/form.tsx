import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC } from 'react';
import { DevLogin } from './dev-login';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import styles from './form.module.css';
import { providers } from '@/app/auth/providers';
import { UserProviderType } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { LoginOptions, login } from './action';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { LoginErrorCookieName, UserCookieName } from '@/lib/cookie';
import { PasskeyAuthenticationButton } from '@/components/Passkey/PasskeyAuthenticationButton';
import { NoticeContext } from '@/components/NoticeContext/NoticeContext';
import { LoginButton } from './button';

interface LoginFormProps {
  returnTo?: string,
}

export const LoginForm: FC<LoginFormProps> = async ({ returnTo }) => {
  const prevUser = await getPreviousUser();

  const options: LoginOptions = {
    returnTo,
    userId: prevUser?.id,
  };

  const availableProviders = Object.fromEntries(Object.entries({ ...providers, [UserProviderType.passkey]: true }).map(
    ([provider, config]) => [provider, config !== undefined && (!prevUser || prevUser.providers.some((p) => p.provider === provider))] as const
  )) as Record<UserProviderType, boolean>;

  const lastUsedProvider = prevUser?.providers[0]?.provider;

  const error = await getLoginErrorCookieValue();

  return (
    <div className={styles.form}>
      <Form action={login.bind(null, 'login', options)}>
        {error === LoginError.Unknown && (<Notice type="error">Unknown error</Notice>)}
        {error === LoginError.WrongUser && (<Notice type="error">The login provider you tried to login with is not linked to your user.<br/>Please login with the login provider you have previously used. You can add additional login providers in your profile after successfully logging in.</Notice>)}
        <NoticeContext>
          {prevUser ? (
            <div style={{ marginBottom: 16 }}>
              <FlexRow align="space-between">
                <span>Login as <b>{prevUser.name}</b></span>
                <Button type="submit" formAction={switchUser} appearance="tertiary">Not you?</Button>
              </FlexRow>
            </div>
          ) : (
            <Notice type="warning">If you have used gw2.me before, please <b>use the same login provider</b> to access your account. You can add additional providers after login.</Notice>
          )}

          <div className={styles.buttons}>
            {availableProviders[UserProviderType.passkey] && (
              <PasskeyAuthenticationButton options={options} lastUsed={lastUsedProvider === UserProviderType.passkey}/>
            )}
            {availableProviders[UserProviderType.discord] && (
              <LoginButton provider={UserProviderType.discord} lastUsed={lastUsedProvider === UserProviderType.discord}/>
            )}
            {availableProviders[UserProviderType.google] && (
              <LoginButton provider={UserProviderType.google} lastUsed={lastUsedProvider === UserProviderType.google}/>
            )}
            {availableProviders[UserProviderType.github] && (
              <LoginButton provider={UserProviderType.github} lastUsed={lastUsedProvider === UserProviderType.github}/>
            )}
            {availableProviders[UserProviderType.steam] && (
              <LoginButton provider={UserProviderType.steam} lastUsed={lastUsedProvider === UserProviderType.steam}/>
            )}
            {availableProviders[UserProviderType.epicgames] && (
              <LoginButton provider={UserProviderType.epicgames} lastUsed={lastUsedProvider === UserProviderType.epicgames}/>
            )}
            {process.env.NODE_ENV !== 'production' && (<DevLogin username={prevUser?.name}/>)}
          </div>
        </NoticeContext>

        <div className={styles.cookie}>
          <Icon icon="cookie"/>
          <div>
            <p>By logging in you accept that gw2.me will store cookies in your browser.</p>
          </div>
        </div>
      </Form>
    </div>
  );
};

export async function getPreviousUser() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(UserCookieName)?.value;

  if(!jwt) {
    return undefined;
  }

  let jwtPayload;
  try {
    jwtPayload = await verifyJwt(jwt, { requiredClaims: ['sub'] });
  } catch {
    return undefined;
  }

  const user = await db.user.findUnique({
    where: { id: jwtPayload.sub },
    select: {
      id: true,
      name: true,
      providers: {
        distinct: ['provider'],
        select: { provider: true },
        orderBy: { usedAt: { sort: 'desc', nulls: 'last' }},
      }
    }
  });

  return user ?? undefined;
}

async function switchUser() {
  'use server';

  const cookieStore = await cookies();
  cookieStore.delete(UserCookieName);

  revalidatePath('');
}

export const enum LoginError {
  Unknown,

  /** Tried to login as a specific user but provided a different token */
  WrongUser,
}

export async function getLoginErrorCookieValue(): Promise<LoginError | undefined> {
  const cookieStore = await cookies();
  const errorCookie = cookieStore.get(LoginErrorCookieName)?.value;

  if(errorCookie === undefined) {
    return undefined;
  }

  try {
    const error: { err: LoginError } = await verifyJwt(errorCookie, { requiredClaims: ['err'] });
    return error.err;
  } catch {
    return LoginError.Unknown;
  }
}
