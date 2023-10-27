import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC } from 'react';
import { DevLogin } from './dev-login';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import styles from './form.module.css';

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
        <Button className={styles.button} type="submit" formAction="/auth/login/discord">Login with Discord</Button>
        {process.env.NODE_ENV !== 'production' && (<DevLogin/>)}
      </div>
    </form>
  );
};
