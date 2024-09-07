import { UserProviderType } from '@gw2me/database';
import { ProviderConfig, getJsonIfOk } from './providers';
import { FC } from 'react';
import icon from './_icons/google.svg';
import Image from 'next/image';

export function google(): ProviderConfig | undefined {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;

  // make sure google is configured
  if(!client_id || !client_secret) {
    console.log('Google integration disabled, not configured');
    return undefined;
  }

  return {
    id: UserProviderType.google,
    supportsPKCE: false,

    getAuthUrl({ redirect_uri, state, prompt }) {
      // build search params url
      const searchParams = new URLSearchParams({
        client_id,
        'scope': 'profile email',
        'response_type': 'code',
        redirect_uri,
        state,
        access_type: 'online',
      });

      if(prompt) {
        searchParams.append('prompt', 'select_account');
      }

      // redirect to google
      return `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;
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
      const token = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: data,
      }).then(getJsonIfOk) as { access_token: string };

      // get profile info with token
      const profile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${token.access_token}` }
      }).then(getJsonIfOk) as { sub: string, name: string, email: string, email_verified: boolean };

      return {
        accountId: profile.sub,
        accountName: profile.email,
        username: profile.name,
        email: profile.email,
        emailVerified: profile.email_verified,
        token,
      };
    }
  };
}

export const GoogleIcon: FC<{ className?: string }> = function GoogleIcon({ className }) {
  return (
    <Image src={icon} alt="" width={16} height={16} className={className}/>
  );
};
