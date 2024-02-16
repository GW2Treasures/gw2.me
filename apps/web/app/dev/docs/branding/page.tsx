/* eslint-disable @next/next/no-img-element */
import { PageLayout } from '@/components/Layout/PageLayout';
import { PageTitle } from '@/components/Layout/PageTitle';
import layoutStyles from '../layout.module.css';
import { Headline } from '@gw2treasures/ui/components/Headline/Headline';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import styles from './page.module.css';
import { Code } from '@/components/Layout/Code';
import { List } from '@gw2treasures/ui/components/Layout/List';
import Link from 'next/link';
import doImg from './gw2me-login-do.png';
import dontImg from './gw2me-login-dont.png';
import { LinkButton } from '@gw2treasures/ui/components/Form/Button';

export default function DevDocsScopePage() {
  return (
    <PageLayout className={layoutStyles.layout}>
      <PageTitle>Branding</PageTitle>
      <p>This document contains the branding guidelines you should follow when using gw2.me in your application.</p>
      <p>If you have questions or need help, please <Link href="/dev/docs#support">contact us</Link>.</p>

      <Headline id="name">Name</Headline>
      <p>This service is called <b>gw2.me</b> (all lowercase with a dot between gw2 and me). Not GW2ME, gw2me, Gw2-Me or any other spelling. If you need to use the name in a place that does not allow special characters, you can use gw2me.</p>

      <Headline id="logo">Logo</Headline>
      <p>Use the following logos and colors to refer to gw2.me.</p>

      <p>
        <FlexRow wrap>
          <div className={styles.icon}><div className={styles.iconBox}><Icon icon="gw2me" color="#b7000d"/></div><Code inline borderless>#b7000d</Code></div>
          <div className={styles.icon}><div className={styles.iconBox}><Icon icon="gw2me" color="#000000"/></div><Code inline borderless>#000000</Code></div>
          <div className={styles.icon}><div className={styles.iconBoxDark}><Icon icon="gw2me" color="#e34c57"/></div><Code inline borderless>#e34c57</Code></div>
          <div className={styles.icon}><div className={styles.iconBoxDark}><Icon icon="gw2me" color="#ffffff"/></div><Code inline borderless>#ffffff</Code></div>
        </FlexRow>
        <FlexRow wrap>
          <div className={styles.icon}><div className={styles.iconBox}><Icon icon="gw2me-outline" color="#b7000d"/></div><Code inline borderless>#b7000d</Code></div>
          <div className={styles.icon}><div className={styles.iconBox}><Icon icon="gw2me-outline" color="#000000"/></div><Code inline borderless>#000000</Code></div>
          <div className={styles.icon}><div className={styles.iconBoxDark}><Icon icon="gw2me-outline" color="#e34c57"/></div><Code inline borderless>#e34c57</Code></div>
          <div className={styles.icon}><div className={styles.iconBoxDark}><Icon icon="gw2me-outline" color="#ffffff"/></div><Code inline borderless>#ffffff</Code></div>
        </FlexRow>
      </p>

      <p style={{ '--icon-color': 'var(--color-brand)' }}><LinkButton href="/dev/docs/branding/gw2.me-icons.zip" external icon="chevron-right" appearance="menu">Download Icons</LinkButton></p>

      <List>
        <li>Always prefer the red versions.</li>
        <li>Always prefer the solid variant over the outlined variant.</li>
        <li>Display the logo at a minimum size of 16px &times; 16px.</li>
        <li>Make sure the logo has sufficient contrast to the background.</li>
        <li>Use the correct color depending on light/dark background.</li>
        <li>Use a solid color as the background.</li>
        <li>Use the SVG logo if possible. If not possible, use a sufficiently high-resolution rasterized image.</li>
      </List>

      <Headline id="button">Login Button</Headline>

      <p>Use the text &quot;Login with gw2.me&quot;, &quot;Sign up with gw2.me&quot;, &quot;Sign in with gw2.me&quot;, &quot;Connect with gw2.me&quot; or similar. Do not use just &quot;Login&quot; or similar without the name &quot;gw2.me&quot;. Do not just use the name &quot;gw2.me&quot; on its own.</p>

      <p>Place your &quot;Login with gw2.me&quot; button with your other social login buttons if you have any. Make sure the social logins are separate from your classic username/password login if you have it.</p>

      <FlexRow wrap>
        <div className={styles.do}>
          <img src={doImg.src} width={doImg.width / 2} height={doImg.height / 2} alt="Example image on how to use the login button"/>
          <div className={styles.label}><Icon icon="checkmark"/> Do</div>
          <List>
            <li>Uses the correct icon, color and text</li>
            <li>Places the button with other social logins and separates them from username/password login</li>
          </List>
        </div>
        <div className={styles.dont}>
          <img src={dontImg.src} width={dontImg.width / 2} height={dontImg.height / 2} alt="Example image on how to not use the login button"/>
          <div className={styles.label}><Icon icon="cancel"/> Don&apos;t</div>
          <List>
            <li>Uses the wrong icon, color and text</li>
            <li>Does not make it clear that username/password is not required for gw2.me</li>
          </List>
        </div>
      </FlexRow>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Branding',
};
