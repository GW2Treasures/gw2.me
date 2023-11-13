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

interface LoginFormProps {
  returnTo?: string;
};

export const LoginForm: FC<LoginFormProps> = ({ returnTo }) => {
  // TODO: update RETURN_TO to only handle trusted urls (encode it? JWT?)

  return (
    <form method="POST">
      {returnTo && (<input type="hidden" name="RETURN_TO" value={returnTo}/>)}
      <Notice type="warning">If you have used gw2.me before, please use the same login provider.</Notice>

      <div className={styles.buttons}>
        {providers[UserProviderType.discord] && (<Button className={styles.button} type="submit" formAction="/auth/login/discord" icon={<DiscordIcon/>}>Login with Discord</Button>)}
        {providers[UserProviderType.github] && (<Button className={styles.button} type="submit" formAction="/auth/login/github" icon={<GitHubIcon/>}>Login with GitHub</Button>)}
        {providers[UserProviderType.steam] && (<Button className={styles.button} type="submit" formAction="/auth/login/steam" icon={<SteamIcon/>}>Login with Steam</Button>)}
        {process.env.NODE_ENV !== 'production' && (<DevLogin/>)}
      </div>
    </form>
  );
};
