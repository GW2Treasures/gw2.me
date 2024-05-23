import { Scope } from "@gw2me/client";
import { client } from "./popup/client";

chrome.runtime.onMessage.addListener(((message, sender, sendResponse) => {
  console.log({ message, sender });

  if(message?.type === 'authorize') {
    authorize(message.prompt)
      .then((response) => sendResponse(response));

    return true;
  }

  return false;
}));

async function authorize(prompt?: 'consent' | 'none') {
  try {
    const redirect_uri = chrome.identity.getRedirectURL();
    console.log('auth', prompt);

    const { code_challenge, code_challenge_method, code_verifier } = await generatePKCEChallenge();

    const scopes = [
      Scope.Accounts,
      Scope.Accounts_DisplayName,
      Scope.GW2_Account,
      Scope.GW2_Inventories,
      Scope.GW2_Characters,
      Scope.GW2_Tradingpost,
      Scope.GW2_Wallet,
      Scope.GW2_Unlocks,
      Scope.GW2_Pvp,
      Scope.GW2_Builds,
      Scope.GW2_Progression,
      Scope.GW2_Guilds,
    ];

    const authUrl = client.getAuthorizationUrl({
      prompt,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      scopes
    });

    const callback = await chrome.identity.launchWebAuthFlow({
      interactive: prompt !== 'none',
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

    await self.chrome.storage.sync.set({ access_token: token.access_token });

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
