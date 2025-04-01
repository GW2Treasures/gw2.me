// this file is not used anywhere, it is instead minified and directly embedded in the button route
// TODO: do this as part of the build process, instead of copy/pasting from https://swc.rs/playground

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function run(fedCmConfig: { configURL: string, clientId: string }, scope: string, code_challenge: string, code_challenge_method: 'S256', fedCmRedirectUrl: URL) {
  // check if FedCM is supported
  const isSupported = 'IdentityCredential' in window;

  if(!isSupported) {
    return;
  }

  // detect if FedCM supports mode
  let supportsMode = false;
  try {
    navigator.credentials.get({
      identity: Object.defineProperty(
        {}, 'mode', {
          get () { supportsMode = true; }
        }
      )
    } as CredentialRequestOptions).catch(() => {});
  } catch {
    // empty on purpose
  }

  const form = document.getElementById('f') as HTMLFormElement;

  // get user info
  IdentityProvider.getUserInfo(fedCmConfig).then((userInfo) => {
    if(userInfo && userInfo.length > 0) {
      document.getElementById('t')!.innerText = 'Sign in as ' + userInfo[0].name;
    }
  });

  function fedcm(mode: 'passive' | 'active') {
    return navigator.credentials.get({
      mediation: 'optional',
      identity: {
        providers: [{
          ...fedCmConfig,
          nonce: `${code_challenge_method}:${code_challenge}`,
          fields: [
            scope.includes('indentify') && 'name',
            scope.includes('email') && 'email',
          ].filter(Boolean),
          params: {
            scope,
            code_challenge,
            code_challenge_method
          }
        }],
        mode
      }
    } as CredentialCreationOptions);
  }

  // register submit event handler
  form.addEventListener('submit', (e) => {
    if(!supportsMode) {
      return;
    }

    // prevent default form submission
    e.preventDefault();

    // attempt FedCM
    try {
      // not using await on purpose, so only sync errors are catched
      fedcm('active').then((credential) => {
        if(credential && 'token' in credential) {
          // redirect to the redirect URL with the token
          open(fedCmRedirectUrl.toString() + '&code=' + credential.token, '_top');
        }
      });
    } catch {
      // fallback to form submission
      form.submit();
    }
  });

  // instantly attempt passive FedCM
  fedcm('passive').then((credential) => {
    if(credential && 'token' in credential) {
      // redirect to the redirect URL with the token
      open(fedCmRedirectUrl.toString() + '&code=' + credential.token, '_top');
    }
  });
}
