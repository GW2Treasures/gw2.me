import { FC, useCallback, useEffect, useState } from 'react';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { Gw2MeClient, Scope } from '@gw2me/client';
import { client } from './client';

export interface AppProps {
  // TODO: add props
}

type State = {
  loading: true,
} | {
  loading: false,
  error?: boolean;
  access_token: undefined,
} | {
  loading: false,
  access_token: string,
};

export const App: FC<AppProps> = ({ }) => {
  const [state, setState] = useState<State>({ loading: true });

  useEffect(() => {
    const loadAccessToken = async () => {
      const value = await self.chrome.storage.sync.get('access_token');

      setState({ loading: false, access_token: value.access_token })
    }

    loadAccessToken()
  }, []);


  const login = useCallback(async () => {
    setState({ loading: true });

    const token = await setup();

    if(!token) {
      setState({ loading: false, access_token: undefined, error: true });
      return;
    }

    const { access_token } = token;

    await self.chrome.storage.sync.set({ access_token });
    setState({ loading: false, access_token })
  }, []);

  if(state.loading) {
    return <>Loading...</>
  }

  return (
    <div>
      {!state.access_token ? (
        <Button onClick={login} icon="gw2me">Login</Button>
      ) : (
        <>{JSON.stringify(state)}</>
      )}
    </div>
  );
};

async function setup() {
  var redirect_uri = chrome.identity.getRedirectURL();
  console.log(redirect_uri);

  const { code_challenge, code_challenge_method, code_verifier } = await generatePKCEChallenge();

  const callback = await chrome.identity.launchWebAuthFlow({
    interactive: true,
    url: client.getAuthorizationUrl({ redirect_uri, scopes: [Scope.GW2_Account], code_challenge, code_challenge_method })
  });

  if(!callback) {
    return undefined;
  }

  const url = new URL(callback);
  const code = url.searchParams.get('code');

  if(!code) {
    return undefined;
  }

  const token = await client.getAccessToken({ code, redirect_uri, code_verifier });

  return token;
}

async function generatePKCEChallenge() {
  const data = new Uint8Array(32);
  crypto.getRandomValues(data);

  const code_verifier = toBase64String(data);

  // const code_verifier = btoa(new TextDecoder().decode(data));
  const code_challenge = toBase64String(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code_verifier))));

  return {
    code_verifier,
    code_challenge,
    code_challenge_method: 'S256' as const
  }
}

/**
 *
 * @param {Uint8Array} data
 * @returns
 */
function toBase64String(data: Uint8Array) {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
