export interface FedCMRequestOptions {
  mediation?: CredentialMediationRequirement;
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

  request({ mediation, signal }: FedCMRequestOptions) {
    if(!this.isSupported()) {
      throw new Error('FedCM is not supported');
    }

    return navigator.credentials.get({
      mediation, signal,
      identity: {
        providers: [{
          configURL: this.#configUrl,
          clientId: this.#clientId,
        }]
      }
    } as CredentialCreationOptions);
  }
}
