import { UserProviderType } from '@gw2me/database';
import { ProviderConfig, getJsonIfOk } from './providers';
import Image from 'next/image';
import type { FC } from 'react';
import iconLight from './_icons/epicgames-black.svg';
import iconDark from './_icons/epicgames-white.svg';

export function epicgames(): ProviderConfig | undefined {
  const client_id = process.env.EPIC_GAMES_CLIENT_ID;
  const client_secret = process.env.EPIC_GAMES_CLIENT_SECRET;

  // make sure provider is configured
  if(!client_id || !client_secret) {
    console.log('Epic Games integration disabled, not configured');
    return undefined;
  }

  return {
    id: UserProviderType.epicgames,
    supportsPKCE: false,

    getAuthUrl({ redirect_uri, state, prompt }) {
      // build auth url
      const searchParams = new URLSearchParams({
        client_id,
        'scope': 'basic_profile',
        'response_type': 'code',
        redirect_uri,
        state,
      });

      if(prompt) {
        searchParams.set('prompt', 'consent');
      }

      // redirect to epic games
      return `https://www.epicgames.com/id/authorize?${searchParams.toString()}`;
    },

    async getUser({ searchParams: { code }, authRequest }) {
      if(!code) {
        throw new Error('code missing');
      }

      // build token request
      const data = new URLSearchParams({
        code,
        'grant_type': 'authorization_code',
        'scope': 'basic_profile',
        'redirect_uri': authRequest.redirect_uri,
      });

      // get token
      const token = await fetch('https://api.epicgames.dev/epic/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: data,
      }).then(getJsonIfOk) as { access_token: string };

      // get profile info with token
      const user = await fetch('	https://api.epicgames.dev/epic/oauth/v2/userInfo', {
        headers: { 'Authorization': `Bearer ${token.access_token}` }
      }).then(getJsonIfOk) as { sub: string, preferred_username: string };

      console.log(user);

      return {
        accountId: user.sub,
        accountName: user.preferred_username,
        username: user.preferred_username,
        token,
      };
    }
  };
}

export const EpicGamesIcon: FC<{ className?: string }> = function EpicGamesIcon({ className }) {
  return (
    <picture className={className} style={{ lineHeight: 1 }}>
      <source srcSet={iconDark.src} media="(prefers-color-scheme: dark)"/>
      <Image src={iconLight} alt="" width={16} height={16}/>
    </picture>
  );
};
