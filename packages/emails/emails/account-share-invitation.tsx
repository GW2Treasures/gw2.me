import { Link } from '@react-email/link';
import { Text } from '@react-email/text';
import Template, { styles } from './template';

export default function AccountShareInvitation({
  username = '{username}',
  owner = '{owner}',
  accountName = 'darthmaim.1234',
  accountsLink = 'https://gw2.me/accounts'
}: { username: string, owner: string, accountName: string, accountsLink: string }) {
  return (
    <Template preview={`${owner} wants to share their account ${accountName} with you!`}>
      <Text style={styles.text}>Hi {username},</Text>
      <Text style={styles.text}>{owner} wants to share their account {accountName} with you.</Text>
      <Text style={styles.text}>
        Visit your <Link href={accountsLink}>Accounts Page</Link> to accept or decline their invitation.
      </Text>
    </Template>
  );
}
