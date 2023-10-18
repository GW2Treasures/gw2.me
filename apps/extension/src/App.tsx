import { FC, useCallback, useEffect, useState } from 'react';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { AccountsResponse, Scope } from '@gw2me/client';
import { client } from './client';

export interface AppProps {
  // TODO: add props
}

enum Step {
  INITIAL,
  LOADING_ACCESS_TOKEN,

  AUTH_REQUIRED,
  AUTH_IN_PROGRESS,
  AUTH_FAILED,

  LOADING_ACCOUNTS,
  READY,
}

function isLoadingStep(step: Step): step is Step.INITIAL | Step.LOADING_ACCESS_TOKEN | Step.AUTH_IN_PROGRESS | Step.LOADING_ACCOUNTS {
  return step === Step.INITIAL || step === Step.LOADING_ACCESS_TOKEN || step === Step.AUTH_IN_PROGRESS || step === Step.LOADING_ACCOUNTS;
}

type State = {
  step: Step.INITIAL | Step.LOADING_ACCESS_TOKEN | Step.AUTH_REQUIRED | Step.AUTH_IN_PROGRESS | Step.AUTH_FAILED,
} | {
  step: Step.LOADING_ACCOUNTS,
  access_token: string,
} | {
  step: Step.READY,
  access_token: string,
  accounts: AccountsResponse['accounts']
};

export const App: FC<AppProps> = ({ }) => {
  const [state, setState] = useState<State>({ step: Step.INITIAL });
  console.log(state);

  useEffect(() => {
    const loadAccessToken = async () => {
      const value = await self.chrome.storage.sync.get('access_token');

      if('access_token' in value && value.access_token) {
        setState({ step: Step.LOADING_ACCOUNTS, access_token: value.access_token });
      } else {
        setState({ step: Step.AUTH_REQUIRED });
      }
    }

    if(state.step === Step.INITIAL) {
      setState({ step: Step.LOADING_ACCESS_TOKEN })
      loadAccessToken()
    }
  }, [state]);

  useEffect(() => {
    if(state.step === Step.LOADING_ACCOUNTS) {
      (window as any).client = client;
      (window as any).access_token = state.access_token;

      client.api(state.access_token).accounts().then((({ accounts }) => {
        setState({ step: Step.READY, access_token: state.access_token, accounts });
      }));
    }
  }, [state])

  const login = useCallback(async () => {
    setState({ step: Step.AUTH_IN_PROGRESS });

    const token = await setup();

    if(!token) {
      setState({ step: Step.AUTH_FAILED });
      return;
    }

    const { access_token } = token;

    await self.chrome.storage.sync.set({ access_token });
    setState({ step: Step.LOADING_ACCOUNTS, access_token })
  }, []);

  if(isLoadingStep(state.step)) {
    return <>Loading... ({state.step}) <a onClick={() => chrome.storage.sync.clear().then(() => setState({ step: Step.INITIAL }))}>Reset</a></>
  }

  return (
    <div>
      {state.step === Step.AUTH_FAILED && (
        <div>Authentication failed</div>
      )}
      {(state.step === Step.AUTH_REQUIRED || state.step === Step.AUTH_FAILED) && (
        <Button onClick={login} icon="gw2me">Login</Button>
      )}
      {state.step === Step.READY && (
        <ul>
          {state.accounts.map((account) => (
            <li key={account.id}>{account.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

async function setup() {
  try {
    const redirect_uri = chrome.identity.getRedirectURL();
    console.log(redirect_uri);

    const { code_challenge, code_challenge_method, code_verifier } = await generatePKCEChallenge();

    const authUrl = client.getAuthorizationUrl({ redirect_uri, scopes: [Scope.GW2_Account], code_challenge, code_challenge_method });

    const callback = await chrome.identity.launchWebAuthFlow({
      interactive: true,
      url: authUrl,
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
  } catch(error) {
    console.log(error);
    return undefined;
  }
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
