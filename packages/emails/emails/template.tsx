import { Body } from '@react-email/body';
import { Column } from '@react-email/column';
import { Container } from '@react-email/container';
import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import { Link } from '@react-email/link';
import { Preview } from '@react-email/preview';
import { Row } from '@react-email/row';
import { Section } from '@react-email/section';

import type { ReactNode } from 'react';

export default function Template({ children, preview }: { children: ReactNode, preview: string }) {
  return (
    <Html>
      <Head/>
      <Preview>{preview}</Preview>
      <Body style={{ ...styles.text, backgroundColor: '#eee', padding: 16 }}>
        <Container style={{ backgroundColor: '#fff', borderRadius: 2, boxShadow: '0 0 2px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.14)' }}>
          <Section>
            <Row style={{ backgroundColor: '#b7000d', color: '#fff', padding: 16, borderRadius: '2px 2px 0 0' }}>
              <Column>
                <Link href="https://gw2.me">
                  <Img src="https://gw2.me/email/assets/header.png" alt="gw2.me" height={48} width={131}/>
                </Link>
              </Column>
            </Row>
            <Row style={{ padding: '8px 28px' }}>
              <Column>
                {children}
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  text: {
    fontSize: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Roboto\', \'Oxygen\', \'Ubuntu\', \'Cantarell\', \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\', sans-serif',
  }
};
