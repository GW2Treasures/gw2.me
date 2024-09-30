import { UserProviderType } from '@gw2me/database';
import { ProviderConfig, getJsonIfOk } from './providers';
import { FC } from 'react';
import iconLight from './_icons/steam-mark.svg';
import iconDark from './_icons/steam-mark-white.svg';
import Image from 'next/image';

export function steam(): ProviderConfig | undefined {
  const apiKey = process.env.STEAM_API_KEY;

  // make sure steam is configured
  if(!apiKey) {
    console.log('Steam integration disabled, not configured');
    return undefined;
  }

  return {
    id: UserProviderType.steam,
    supportsPKCE: false,

    getAuthUrl({ redirect_uri, state }) {
      const return_to = new URL(redirect_uri);
      return_to.searchParams.append('state', state);

      // build search params url
      const searchParams = new URLSearchParams({
        'openid.mode': 'checkid_setup',
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.return_to': return_to.toString(),
        'openid.realm': return_to.origin,
      });

      // redirect to steam
      return `https://steamcommunity.com/openid/login?${searchParams.toString()}`;
    },

    async getUser({ searchParams }) {
      // verify response
      const verifySearchParams = new URLSearchParams(searchParams as Record<string, string>);
      verifySearchParams.delete('state');
      verifySearchParams.set('openid.mode', 'check_authentication');

      console.log(verifySearchParams);
      const verifyResponse = await fetch(`https://steamcommunity.com/openid/login?${verifySearchParams.toString()}`).then((r) => r.text());

      if(verifyResponse !== 'ns:http://specs.openid.net/auth/2.0\nis_valid:true\n') {
        console.log(JSON.stringify(verifyResponse));
        throw new Error('Invalid openid authorization');
      }

      const claimed_id = searchParams['openid.claimed_id'];
      const steamId = claimed_id?.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/)?.[1];

      const data = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`).then(getJsonIfOk) as { response: { players: [{ steamid: string, personaname: string }] }};
      const profile = data.response.players[0];

      return {
        accountId: profile.steamid,
        accountName: profile.personaname,
        username: profile.personaname,
        token: {},
      };
    }
  };
}

export const SteamIcon: FC<{ className?: string }> = function GithubIcon({ className }) {
  return (
    <picture className={className} style={{ lineHeight: 1 }}>
      <source srcSet={iconDark.src} media="(prefers-color-scheme: dark)"/>
      <Image src={iconLight} alt="" width={16} height={16}/>
    </picture>
  );
};
