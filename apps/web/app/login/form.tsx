import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FC } from 'react';
import { DevLogin } from './dev-login';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import styles from './form.module.css';

interface LoginFormProps {
  // TODO: define props
};

export const LoginForm: FC<LoginFormProps> = ({ }) => {

  return (
    <form method="POST">
      <Notice type="warning">If you have used gw2.me before, please use the same login provider.</Notice>

      <div className={styles.buttons}>
        <Button className={styles.button} type="submit" formAction="/auth/login/discord">Login with Discord</Button>
        {process.env.NODE_ENV !== 'production' && (<DevLogin/>)}
      </div>
    </form>
  );
};
