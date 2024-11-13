import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC } from 'react';
import { DevLogin } from './dev-login';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import styles from './form.module.css';
import { providers } from 'app/auth/providers';
import { UserProviderType } from '@gw2me/database';
import { DiscordIcon } from 'app/auth/discord';
import { GitHubIcon } from 'app/auth/github';
import { SteamIcon } from 'app/auth/steam';
import { GoogleIcon } from 'app/auth/google';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { LoginOptions, login } from './action';
import { Form } from '@gw2treasures/ui/components/Form/Form';
import { cookies } from 'next/headers';
import { createVerifier } from '@/lib/jwt';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { LoginErrorCookieName, UserCookieName } from '@/lib/cookie';
import { PasskeyAuthenticationButton } from '@/components/Passkey/PasskeyAuthenticationButton';
import { NoticeContext } from '@/components/NoticeContext/NoticeContext';
import { EpicGamesIcon } from 'app/auth/epicgames';

interface LoginFormProps {
  returnTo?: string;
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
            {availableProviders[UserProviderType.passkey] && (<PasskeyAuthenticationButton className={styles.button} options={options}/>)}
            {availableProviders[UserProviderType.discord] && (<Button className={styles.button} type="submit" name="provider" value="discord" icon={<DiscordIcon/>}>Login with Discord</Button>)}
            {availableProviders[UserProviderType.google] && (<Button className={styles.button} type="submit" name="provider" value="google" icon={<GoogleIcon/>}>Login with Google</Button>)}
            {availableProviders[UserProviderType.github] && (<Button className={styles.button} type="submit" name="provider" value="github" icon={<GitHubIcon/>}>Login with GitHub</Button>)}
            {availableProviders[UserProviderType.steam] && (<Button className={styles.button} type="submit" name="provider" value="steam" icon={<SteamIcon/>}>Login with Steam</Button>)}
            {availableProviders[UserProviderType.epicgames] && (<Button className={styles.button} type="submit" name="provider" value="epicgames" icon={<EpicGamesIcon/>}>Login with Epic Games</Button>)}
            {process.env.NODE_ENV !== 'production' && (<DevLogin username={prevUser?.name}/>)}
          </div>
        </NoticeContext>

        <div className={styles.cookie}>
          <FlexRow>
            <Icon icon="cookie"/>
            <p>By logging in you accept that gw2.me will store cookies in your browser.</p>
          </FlexRow>
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

  const verifyJwt = createVerifier();

  let jwtPayload: { sub: string };
  try {
    jwtPayload = verifyJwt(jwt);
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

  const verifyJwt = createVerifier();

  try {
    const error: { err: LoginError } = verifyJwt(errorCookie);
    return error.err;
  } catch {
    return LoginError.Unknown;
  }
}
