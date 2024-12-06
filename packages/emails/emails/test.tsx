import { Text } from '@react-email/text';
import Template, { styles } from './template';

export default function TestEmail() {
  return (
    <Template preview="This is a test.">
      <Text style={styles.text}>This email is a test sent by gw2.me.</Text>
    </Template>
  );
}
