import { type FC, useCallback, useEffect, useState } from 'react';
import { Button } from '@gw2treasures/ui/components/Form/Button';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { Icon } from '@gw2treasures/ui/icons/Icon';
import { type AccountsResponse, type TokenResponse } from '@gw2me/client';
import { client } from './client';
import styles from './App.module.css';

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

export const App: FC = () => {
  const [state, setState] = useState<State>({ step: Step.INITIAL });
  const [accountState, setAccountState] = useState<Record<string, undefined | 'loading' | 'copied'>>({});

  useEffect(() => {
    const loadAccessToken = async () => {
      const value = await self.chrome.storage.sync.get('access_token');

      if('access_token' in value && value.access_token) {
        setState({ step: Step.LOADING_ACCOUNTS, access_token: value.access_token });
      } else {
        const token = await authorize('none');

        if(!token) {
          setState({ step: Step.AUTH_REQUIRED });
        } else {
          const { access_token } = token;

          await self.chrome.storage.sync.set({ access_token });
          setState({ step: Step.LOADING_ACCOUNTS, access_token })
        }
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

      console.log('loading accounts', state);

      client.api(state.access_token).accounts().then((({ accounts }) => {
        setState({ step: Step.READY, access_token: state.access_token, accounts });
      })).catch(() => {
        setState({ step: Step.AUTH_REQUIRED });
      });
    }
  }, [state])

  const login = useCallback(async () => {
    setState({ step: Step.AUTH_IN_PROGRESS });

    const token = await authorize();

    if(!token) {
      setState({ step: Step.AUTH_FAILED });
      return;
    }

    const { access_token } = token;

    await self.chrome.storage.sync.set({ access_token });
    setState({ step: Step.LOADING_ACCOUNTS, access_token })
  }, []);

  const logout = useCallback(async () => {
    await self.chrome.storage.sync.remove('access_token');
    setState({ step: Step.AUTH_REQUIRED })
  }, []);

  const createSubtoken = useCallback(async (accountId: string) => {
    if(state.step !== Step.READY) {
      return;
    }

    setAccountState((accounts) => ({ ...accounts, [accountId]: 'loading' }));

    const subtoken = await client.api(state.access_token).subtoken(accountId);
    navigator.clipboard.writeText(subtoken.subtoken);

    setAccountState((accounts) => ({ ...accounts, [accountId]: 'copied' }));

    setTimeout(() => {
      setAccountState((accounts) => ({ ...accounts, [accountId]: undefined }));
    }, 1000);
  }, [state]);

  const manageAccounts = useCallback(async () => {
    const token = await authorize('consent');

    if(!token) {
      return;
    }

    const { access_token } = token;

    await self.chrome.storage.sync.set({ access_token });
    setState({ step: Step.LOADING_ACCOUNTS, access_token })
  }, []);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.title}>gw2.me</div>
        {state.step === Step.READY && (
          <Button onClick={logout} className={styles.logoutButton}>Logout</Button>
        )}
      </div>
      <div className={styles.content}>
        {isLoadingStep(state.step) ? (
          <FlexRow>
            <Icon icon="loading"/>
            Loading
          </FlexRow>
        ) : (
          <>
            {state.step === Step.AUTH_FAILED && (
              <div className={styles.error}>Authentication failed</div>
            )}
            {(state.step === Step.AUTH_REQUIRED || state.step === Step.AUTH_FAILED) && (
              <>
                <p>You need to connect with gw2.me to access your accounts.</p>
                <Button onClick={login} icon="gw2me" className={styles.loginButton}>Continue with gw2.me</Button>
              </>
            )}
            {state.step === Step.READY && (
              <>
                <ul className={styles.accountList}>
                  <li>
                    <Button flex icon="gw2me-outline" appearance="menu" onClick={manageAccounts}>Manage Accounts</Button>
                  </li>
                  {state.accounts.map((account) => (
                    <li key={account.id}>
                      <Button flex icon={accountState[account.id] === 'copied' ? 'checkmark' : accountState[account.id] === 'loading' ? 'loading' : 'copy'} onClick={() => createSubtoken(account.id)} appearance="menu">
                        {account.displayName ?? account.name}
                        {account.displayName && (<div style={{ color: 'var(--color-text-muted)' }}>{account.name}</div>)}
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

async function authorize(prompt?: 'consent' | 'none'): Promise<TokenResponse | undefined> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'authorize', prompt }, resolve);
  });
}
