import { Gw2MeError } from './error.js';
import { Scope } from './types.js';

export interface FedCMRequestOptions {
  scopes: Scope[],
  mediation?: CredentialMediationRequirement,
  mode?: 'passive' | 'active',
  signal?: AbortSignal,
  code_challenge: string,
  code_challenge_method: 'S256',
  /** @default true */
  include_granted_scopes?: boolean,
}

export class Gw2MeFedCM {
  #configUrl;
  #clientId;

  constructor(configUrl: URL, clientId: string) {
    this.#configUrl = configUrl;
    this.#clientId = clientId;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'IdentityCredential' in window;
  }

  request({ scopes, mediation, signal, mode, code_challenge, code_challenge_method, include_granted_scopes }: FedCMRequestOptions) {
    if(!this.isSupported()) {
      throw new Gw2MeError('FedCM is not supported');
    }

    return navigator.credentials.get({
      mediation, signal,
      identity: {
        providers: [{
          configURL: this.#configUrl,
          clientId: this.#clientId,
          fields: [
            scopes.includes(Scope.Identify) && 'name',
            scopes.includes(Scope.Email) && 'email',
          ].filter(Boolean),
          // also pass the PKCE challenge as nonce for browser not supporting params
          nonce: `${code_challenge_method}:${code_challenge}`,
          params: {
            scope: scopes.join(' '),
            code_challenge,
            code_challenge_method,
            include_granted_scopes,
          }
        }],
        mode
      }
    } as CredentialCreationOptions) as Promise<null | { token: string, type: 'identity' }>;
  }
}
