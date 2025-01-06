import { Gw2MeError } from './error';
import { Scope } from './types';

export interface FedCMRequestOptions {
  scopes: Scope[],
  mediation?: CredentialMediationRequirement;
  mode?: 'passive' | 'active';
  signal?: AbortSignal;
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

  request({ scopes, mediation, signal, mode }: FedCMRequestOptions) {
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
          params: {
            scope: scopes.join(' ')
          }
        }],
        mode
      }
    } as CredentialCreationOptions) as Promise<null | { token: string, type: 'identity' }>;
  }
}
