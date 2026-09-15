import { UserProviderType } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { DiscordIcon } from '@/app/auth/discord';
import { EpicGamesIcon } from '@/app/auth/epicgames';
import { GitHubIcon } from '@/app/auth/github';
import { GoogleIcon } from '@/app/auth/google';
import { SteamIcon } from '@/app/auth/steam';
import type { FC } from 'react';

export interface ProviderProps {
  provider: UserProviderType,
}

export interface ProviderIconProps extends ProviderProps {
  className?: string,
}

export const Provider: FC<ProviderProps> = ({ provider }) => {
  return (
    <FlexRow>
      <ProviderIcon provider={provider}/>
      <ProviderName provider={provider}/>
    </FlexRow>
  );
};

export const ProviderName: FC<ProviderProps> = ({ provider }) => {
  switch (provider) {
    case 'discord': return 'Discord';
    case 'github': return 'GitHub';
    case 'steam': return 'Steam';
    case 'google': return 'Google';
    case 'passkey': return 'Passkey';
    case 'epicgames': return 'Epic Games';
  }
};

export const ProviderIcon: FC<ProviderIconProps> = ({ provider, className }) => {
  switch (provider) {
    case 'discord': return <DiscordIcon className={className}/>;
    case 'github': return <GitHubIcon className={className}/>;
    case 'steam': return <SteamIcon className={className}/>;
    case 'google': return <GoogleIcon className={className}/>;
    case 'passkey': return <Icon icon="passkey" className={className}/>;
    case 'epicgames': return <EpicGamesIcon className={className}/>;
  }
};
