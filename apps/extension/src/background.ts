import { Scope } from '@gw2me/client';
import { client } from './popup/client';

chrome.runtime.onMessage.addListener(((message, sender, sendResponse) => {
  // handle authorization messages
  if(isAuthorizationMessage(message)) {
    authorize(message.prompt).then(sendResponse);

    // return true to let the browser know that the message was handled and there will be a response,
    // otherwise sendResponse will not work later after the authorize Promise resolved.
    return true;
  }

  // we did not handle the message
  return false;
}));


type AuthorizationMessage = { type: 'gw2.me:authorize', prompt?: 'consent' | 'none' }

/** Check if the message is a authorize request */
function isAuthorizationMessage(message: unknown): message is AuthorizationMessage {
  return typeof message === 'object' && message != null && 'type' in message && message.type === 'gw2.me:authorize';
}

/** Handle the authorization flow using `identity.launchWebAuthFlow`. */
async function authorize(prompt?: 'consent' | 'none') {
  // this function runs the whole OAuth2 authorization flow described at https://gw2.me/dev/docs/access-tokens.

  // log the auth attempt for debugging
  console.log('auth', prompt);

  try {
    // get browser redirect url (this is either 'https://<id>.chromiumapp.org/' for chromium browsers or 'https://<id>.extensions.allizom.org/' for firefox)
    // note that this redirect url has to be registered on gw2.me as a redirect url.
    const redirect_uri = chrome.identity.getRedirectURL();

    // create PKCE challenge for more security. See https://gw2.me/dev/docs/access-tokens#pkce
    const { code_challenge, code_challenge_method, code_verifier } = await generatePKCEChallenge();

    // the scopes we are requesting. See https://gw2.me/dev/docs/scopes for available scopes.
    // We need `accounts` to show a list of all accounts, `accounts.displayName` to show the custom name of each account if set
    // and all the GW2 scopes so that we can generate subtokens will all possible permissions.
    const scopes: Scope[] = [
      Scope.Accounts,
      Scope.Accounts_DisplayName,
      Scope.GW2_Account,
      Scope.GW2_Inventories,
      Scope.GW2_Characters,
      Scope.GW2_Tradingpost,
      Scope.GW2_Wallet,
      Scope.GW2_Unlocks,
      Scope.GW2_Pvp,
      Scope.GW2_Wvw,
      Scope.GW2_Builds,
      Scope.GW2_Progression,
      Scope.GW2_Guilds,
    ];

    // get the authorization url of the consent screen
    const authUrl = client.getAuthorizationUrl({
      prompt,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      scopes
    });

    // start the authorization flow in the browser. This will return an URL (as string) with the code parameter if successful
    const redirectedUrl = await chrome.identity.launchWebAuthFlow({
      interactive: prompt !== 'none',
      url: authUrl,
    });

    // if the user was not redirected to the success url, the authorization was canceled or not successful
    if(!redirectedUrl) {
      return undefined;
    }

    // parse the `code` search parameter from the URL
    const url = new URL(redirectedUrl);
    const code = url.searchParams.get('code');

    // if there is no code, there probably was an error
    if(!code) {
      console.log('Authorization failed', redirectedUrl);
      return undefined;
    }

    // exchange the code for an access token
    const token = await client.getAccessToken({ code, redirect_uri, code_verifier });

    // store the access token in synced storage, so it can be accessed later by the popup
    await self.chrome.storage.sync.set({ access_token: token.access_token });

    // return the token to the popup
    return token;
  } catch(error) {
    console.log(error);
    return undefined;
  }
}

/** Generate a PKCE challenge */
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

/** Convert an `Uint8Array` to a base64 encoded string. */
function toBase64String(data: Uint8Array) {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
