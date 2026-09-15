import { UserProviderType } from '@gw2me/database';
import { Icon } from '@gw2treasures/ui';
import Image from 'next/image';
import discordIcon from './icons/discord-mark-blue.svg';
import githubLightIcon from './icons/github-mark.svg';
import githubDarkIcon from './icons/github-mark-white.svg';
import steamLightIcon from './icons/steam-mark.svg';
import steamDarkIcon from './icons/steam-mark-white.svg';
import googleIcon from './icons/google.svg';
import epicGamesLightIcon from './icons/epicgames-black.svg';
import epicGamesDarkIcon from './icons/epicgames-white.svg';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import type { FC } from 'react';

export interface ProviderProps {
  provider: UserProviderType,
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

export const ProviderIcon: FC<ProviderProps> = ({ provider }) => {
  switch (provider) {
    case 'discord': return <DiscordIcon/>;
    case 'github': return <GitHubIcon/>;
    case 'steam': return <SteamIcon/>;
    case 'google': return <GoogleIcon/>;
    case 'passkey': return <Icon icon="passkey"/>;
    case 'epicgames': return <EpicGamesIcon/>;
  }
};

export const DiscordIcon: FC<{ className?: string }> = function DiscordIcon({ className }) {
  return (
    <Image className={className} alt="" src={discordIcon} width={16} height={16}/>
  );
};

export const GitHubIcon: FC<{ className?: string }> = function GithubIcon({ className }) {
  return (
    <picture className={className} style={{ lineHeight: 1 }}>
      <source srcSet={githubDarkIcon.src} media="(prefers-color-scheme: dark)"/>
      <Image src={githubLightIcon} alt="" width={16} height={16}/>
    </picture>
  );
};

export const SteamIcon: FC<{ className?: string }> = function SteamIcon({ className }) {
  return (
    <picture className={className} style={{ lineHeight: 1 }}>
      <source srcSet={steamDarkIcon.src} media="(prefers-color-scheme: dark)"/>
      <Image src={steamLightIcon} alt="" width={16} height={16}/>
    </picture>
  );
};

export const GoogleIcon: FC<{ className?: string }> = function GoogleIcon({ className }) {
  return (
    <Image src={googleIcon} alt="" width={16} height={16} className={className}/>
  );
};

export const EpicGamesIcon: FC<{ className?: string }> = function EpicGamesIcon({ className }) {
  return (
    <picture className={className} style={{ lineHeight: 1 }}>
      <source srcSet={epicGamesDarkIcon.src} media="(prefers-color-scheme: dark)"/>
      <Image src={epicGamesLightIcon} alt="" width={16} height={16}/>
    </picture>
  );
};
