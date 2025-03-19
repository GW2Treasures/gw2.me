/// <reference types="@gw2treasures/ui/types" />
/// <reference types="react/canary" />
/// <reference types="react-dom/canary" />

// TODO: this should not be necessary, because this is already defined in the above reference of @gw2treasures/ui/types
declare module '*.svg?svgr' {
  import React from 'react';
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

interface Navigator {
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/login) */
  login: NavigatorLogin
}

/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLoginn) */
interface NavigatorLogin {
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLogin/setStatus) */
  setStatus(status: 'logged-in' | 'logged-out'): Promise<undefined>
}

interface Window {
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/IdentityProvider) */
  IdentityProvider: IdentityProvider
}

/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/IdentityProvider) */
interface IdentityProvider {
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/IdentityProvider/close_static) */
  close(): undefined

  resolve(token: string, options?: { accountId: string }): undefined
}

