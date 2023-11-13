import { UserProviderType } from '@gw2me/database';
import { ProviderConfig, getJsonIfOk } from './providers';
import { FC } from 'react';
import iconLight from './_icons/github-mark.svg';
import iconDark from './_icons/github-mark-white.svg';
import Image from 'next/image';

export function github(): ProviderConfig | undefined {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  // make sure github is configured
  if(!client_id || !client_secret) {
    console.log('Github integration disabled, not configured');
    return undefined;
  }

  return {
    id: UserProviderType.github,
    supportsPKCE: false,

    getAuthUrl({ redirect_uri, state }) {
      // build search params url
      const searchParams = new URLSearchParams({
        client_id,
        'scope': 'user:email',
        'response_type': 'code',
        redirect_uri,
        state,
      });

      // redirect to github
      return `https://github.com/login/oauth/authorize?${searchParams.toString()}`;
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
      });

      // get access_token token
      const token = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: data,
      }).then(getJsonIfOk) as { access_token: string };

      // get profile info with token
      const profile = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token.access_token}` }
      }).then(getJsonIfOk) as { id: number, login: string, email: string };

      return {
        accountId: profile.id.toString(),
        accountName: profile.login,
        username: profile.login,
        email: profile.email,
        token,
      };
    }
  };
}

export const GitHubIcon: FC<{ className?: string }> = function GithubIcon({ className }) {
  return (
    <picture className={className}>
      <source srcSet={iconDark.src} media="(prefers-color-scheme: dark)"/>
      <Image src={iconLight} alt="" width={16} height={16}/>
    </picture>
  );
};
