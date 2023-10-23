import { UserProviderType } from '@gw2me/database';
import 'server-only';

interface ProviderConfig {
  id: UserProviderType,

  getAuthUrl(options: { redirect_uri: string, state: string, code_challenge: string, code_challenge_method: string }): string
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
    }
  };
}

// map user provider keys to provider configs
export const providers: Record<string, ProviderConfig | undefined> = {
  [UserProviderType.discord]: discord()
} satisfies Record<UserProviderType, ProviderConfig | undefined>;
