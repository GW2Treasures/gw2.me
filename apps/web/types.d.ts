/// <reference types="@gw2treasures/ui/types" />
/// <reference types="react/canary" />
/// <reference types="react-dom/canary" />

interface Window {
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/IdentityProvider) */
  IdentityProvider: IdentityProvider,
}

/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/IdentityProvider) */
interface IdentityProvider {
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/IdentityProvider/close_static) */
  close(): undefined,

  resolve(token: string, options?: { accountId: string }): undefined,
}
