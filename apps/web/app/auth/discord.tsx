import { UserProviderType } from '@gw2me/database';
import { ProviderConfig, getJsonIfOk } from './providers';
import icon from './_icons/discord-mark-blue.svg';
import Image from 'next/image';
import type { FC } from 'react';

export function discord(): ProviderConfig | undefined {
  const client_id = process.env.DISCORD_CLIENT_ID;
  const client_secret = process.env.DISCORD_CLIENT_SECRET;

  // make sure discord is configured
  if(!client_id || !client_secret) {
    console.log('Discord integration disabled, not configured');
    return undefined;
  }

  return {
    id: UserProviderType.discord,
    supportsPKCE: true,

    getAuthUrl({ redirect_uri, state, code_challenge, code_challenge_method, prompt }) {
      // build discord url
      const searchParams = new URLSearchParams({
        client_id,
        'scope': 'identify email',
        'response_type': 'code',
        'prompt': 'none',
        code_challenge: code_challenge!,
        code_challenge_method: code_challenge_method!,
        redirect_uri,
        state,
      });

      if(prompt) {
        searchParams.append('prompt', 'consent');
      }

      // redirect to discord
      return `https://discord.com/oauth2/authorize?${searchParams.toString()}`;
    },

    async getUser({ searchParams: { code }, authRequest }) {
      if(!code) {
        throw new Error('code missing');
      }

      // build token request
      const data = new URLSearchParams({
        code,
        client_id,
        client_secret,
        'grant_type': 'authorization_code',
        'redirect_uri': authRequest.redirect_uri,
        'code_verifier': authRequest.code_verifier!,
      });

      // get discord token
      const token = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data,
      }).then(getJsonIfOk) as { access_token: string };

      // get profile info with token
      const profile = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${token.access_token}` }
      }).then(getJsonIfOk) as { id: string, username: string, email: string, verified: boolean, discriminator: string };

      // get discord user name (darthmaim or legacy darthmaim#1234)
      const displayName = profile.discriminator !== '0'
        ? `${profile.username}#${profile.discriminator.padStart(4, '0')}`
        : profile.username;

      return {
        accountId: profile.id,
        accountName: displayName,
        username: profile.username,
        email: profile.email,
        emailVerified: profile.verified,
        token,
      };
    }
  };
}

export const DiscordIcon: FC<{ className?: string }> = function DiscordIcon({ className }) {
  return (
    <Image className={className} alt="" src={icon} width={16} height={16}/>
  );
};
