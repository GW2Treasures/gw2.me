import { UserProviderRequest, UserProviderType } from '@gw2me/database';
import 'server-only';

interface ProviderConfig {
  id: UserProviderType,

  getAuthUrl(options: { redirect_uri: string, state: string, code_challenge: string, code_challenge_method: string }): string

  getUser(params: { code: string, authRequest: UserProviderRequest }): Promise<{
    /** identifier used by the provider */
    accountId: string;

    /** display name that is used on the provider side to identify the user */
    accountName: string;

    /** username that should be used on gw2.me  */
    username: string;

    /** email */
    email?: string;

    /** token to make additional requests in the future */
    token: string;
  }>
}

function discord(): ProviderConfig | undefined {
  const discord_client_id = process.env.DISCORD_CLIENT_ID;
  const discord_client_secret = process.env.DISCORD_CLIENT_SECRET;

  // make sure discord is configured
  if(!discord_client_id || !discord_client_secret) {
    return undefined;
  }

  return {
    id: UserProviderType.discord,

    getAuthUrl({ redirect_uri, state, code_challenge, code_challenge_method }) {
      // build discord url
      const searchParams = new URLSearchParams({
        'client_id': discord_client_id,
        'scope': 'identify email',
        'response_type': 'code',
        'prompt': 'none',
        code_challenge,
        code_challenge_method,
        redirect_uri,
        state,
      });

      // redirect to discord
      return `https://discord.com/oauth2/authorize?${searchParams.toString()}`;
    },

    async getUser({ code, authRequest }) {
      // build token request
      const data = new URLSearchParams({
        // eslint-disable-next-line object-shorthand
        'code': code,
        'client_id': discord_client_id,
        'client_secret': discord_client_secret,
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
      }).then(getJsonIfOk) as { id: string, username: string, email: string, discriminator: string };

      // get discord user name (darthmaim or legacy darthmaim#1234)
      const displayName = profile.discriminator !== '0'
        ? `${profile.username}#${profile.discriminator.padStart(4, '0')}`
        : profile.username;

      return {
        accountId: profile.id,
        accountName: displayName,
        username: profile.username,
        email: profile.email,
        token: token.access_token,
      };
    }
  };
}

// map user provider keys to provider configs
export const providers: Record<string, ProviderConfig | undefined> = {
  [UserProviderType.discord]: discord()
} satisfies Record<UserProviderType, ProviderConfig | undefined>;


function getJsonIfOk(response: Response) {
  if(!response.ok) {
    throw new Error('Could not load discord profile');
  }

  return response.json();
}
