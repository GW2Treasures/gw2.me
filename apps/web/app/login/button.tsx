import type { FC, ReactNode } from 'react';
import { UserProviderType } from '@gw2me/database';
import styles from './button.module.css';
import { ProviderIcon, ProviderName } from '@/components/Provider/Provider';
import { cx, Icon } from '@gw2treasures/ui';
import { IconProp } from '@gw2treasures/icons';
import resetStyles from '@gw2treasures/ui/reset.module.css';

export interface LoginButtonProps {
  provider: UserProviderType | 'dev',
  lastUsed?: boolean,
  onClick?: () => void,
  disabled?: boolean,
  icon?: IconProp,
  subtitle?: ReactNode,
}

export const LoginButton: FC<LoginButtonProps> = ({ provider, lastUsed, onClick, disabled, icon, subtitle }) => {
  return (
    <button className={cx(resetStyles.reset, styles.button)} type={onClick ? 'button' : 'submit'} name="provider" value={provider} onClick={onClick} disabled={disabled}>
      <span className={styles.icon}>
        {icon ? <Icon icon={icon}/> : (provider === 'dev' ? <Icon icon="user"/> : <ProviderIcon provider={provider}/>)}
      </span>
      <span className={styles.buttonContent}>
        <b>{provider === 'dev' ? 'Dev Login' : <ProviderName provider={provider}/>}</b>
        <span>{subtitle ?? ProviderSubtitles[provider]}</span>
      </span>
      {lastUsed && <span className={styles.lastUsed}>Last used</span>}
      <Icon icon="chevron-right" className={styles.chevron}/>
    </button>
  );
};

const ProviderSubtitles: Record<UserProviderType | 'dev', string> = {
  [UserProviderType.passkey]: 'Use passkeys to login',
  [UserProviderType.discord]: 'Use your Discord account to login',
  [UserProviderType.google]: 'Use your Google account to login',
  [UserProviderType.github]: 'Use your GitHub account to login',
  [UserProviderType.steam]: 'Use your Steam account to login',
  [UserProviderType.epicgames]: 'Use your Epic Games account to login',
  dev: 'Debug',
};
