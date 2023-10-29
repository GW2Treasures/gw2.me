import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC } from 'react';
import { DevLogin } from './dev-login';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import styles from './form.module.css';
import Image from 'next/image';
import discord from './discord-mark-blue.svg';
import githubLight from './github-mark.svg';
import githubDark from './github-mark-white.svg';
import { providers } from 'app/auth/providers';
import { UserProviderType } from '@gw2me/database';

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
        {providers[UserProviderType.discord] && (<Button className={styles.button} type="submit" formAction="/auth/login/discord" icon={<Image src={discord} alt="" width={16} height={16}/>}>Login with Discord</Button>)}
        {providers[UserProviderType.github] && (<Button className={styles.button} type="submit" formAction="/auth/login/github" icon={<picture><source srcSet={githubDark.src} media="(prefers-color-scheme: dark)"/><Image src={githubLight} alt="" width={16} height={16}/></picture>}>Login with GitHub</Button>)}
        {process.env.NODE_ENV !== 'production' && (<DevLogin/>)}
      </div>
    </form>
  );
};
