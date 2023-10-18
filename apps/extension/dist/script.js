const button = document.getElementById('b');
button.addEventListener('click', setup)

const client_id = 'd81b650e-ef90-493a-97a3-871bfcb8063e';

async function setup() {  
  var redirect_uri = chrome.identity.getRedirectURL();
  console.log(redirect_uri);

  const pkce = await generatePKCEChallenge();
  console.log(pkce);

  const callback = await chrome.identity.launchWebAuthFlow({
    interactive: true,
    url: `https://gw2.me/oauth2/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=identify&code_challenge=${encodeURIComponent(pkce.code_challenge)}&code_challenge_method=${pkce.code_challenge_method}`
  });

  const url = new URL(callback);
  const code = url.searchParams.get('code');

  console.log(code);
  
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code, client_id, redirect_uri, code_verifier: pkce.code_verifier
  });

  // get discord token
  const token = await fetch('https://gw2.me/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data,
    cache: 'no-store'
  }).then((r) => r.json());

  console.log(token);
}

async function generatePKCEChallenge() {
  const data = new Uint8Array(32);
  crypto.getRandomValues(data);

  const code_verifier = toBase64String(data);

  // const code_verifier = btoa(new TextDecoder().decode(data));
  const code_challenge = toBase64String(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code_verifier))));

  return {
    code_verifier, code_challenge, code_challenge_method: 'S256'
  }
}

/**
 * 
 * @param {Uint8Array} data 
 * @returns 
 */
function toBase64String(data) {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
