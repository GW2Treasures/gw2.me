import { Link, Text } from '@react-email/components';
import Template, { styles } from './template';

export default function VerifyEmailMail({ username = '{username}', verifyLink = 'https://gw2.me/emails/verify?token={token}' }: { username: string, verifyLink: string }) {
  return (
    <Template preview="Please verify your email">
      <Text style={styles.text}>Hi {username}, </Text>
      <Text style={styles.text}>Please verify your email address by clicking the following link:</Text>
      <Text>
        <Link style={styles.text} href={verifyLink}>{verifyLink}</Link>
      </Text>
    </Template>
  );
}
