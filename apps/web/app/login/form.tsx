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

interface LoginFormProps {
  returnTo?: string;
};

export const LoginForm: FC<LoginFormProps> = ({ returnTo }) => {
  // TODO: update RETURN_TO to only handle trusted urls (encode it? JWT?)
  const options: LoginOptions = {
    returnTo
  };

  return (
    <div className={styles.form}>
      <Form action={login.bind(null, 'login', options)}>
        <Notice type="warning">If you have used gw2.me before, please <b>use the same login provider</b> to access your account. You can add additional providers after login.</Notice>

        <div className={styles.buttons}>
          {providers[UserProviderType.discord] && (<Button className={styles.button} type="submit" name="provider" value="discord" icon={<DiscordIcon/>}>Login with Discord</Button>)}
          {providers[UserProviderType.google] && (<Button className={styles.button} type="submit" name="provider" value="google" icon={<GoogleIcon/>}>Login with Google</Button>)}
          {providers[UserProviderType.github] && (<Button className={styles.button} type="submit" name="provider" value="github" icon={<GitHubIcon/>}>Login with GitHub</Button>)}
          {providers[UserProviderType.steam] && (<Button className={styles.button} type="submit" name="provider" value="steam" icon={<SteamIcon/>}>Login with Steam</Button>)}
          {process.env.NODE_ENV !== 'production' && (<DevLogin/>)}
        </div>

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
