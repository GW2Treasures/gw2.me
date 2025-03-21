import { Gw2MeClient } from './client';
import type { Options, Scope } from './types';

export function register(options?: Partial<Options>) {
  const baseUrl = options?.url || 'https://gw2.me/';

  class Gw2MeButtonElement extends HTMLElement {
    #iframe: HTMLIFrameElement;
    #gw2me!: Gw2MeClient;

    constructor() {
      super();

      // create iframe
      this.#iframe = document.createElement('iframe');
      this.#iframe.style.border = 'none';
      this.#iframe.style.overflow = 'hidden';
      this.#iframe.allow = 'identity-credentials-get';

      this.#updateIframeSrc();
    }

    connectedCallback() {
      const shadow = this.attachShadow({ mode: 'closed' });
      shadow.appendChild(this.#iframe);

      if(this.#gw2me.fedCM.isSupported()) {
        const attributes = this.#getAttributes();

        this.#gw2me.fedCM.request({
          mode: 'passive',
          mediation: 'optional',
          scopes: attributes.scopes.split(' ') as Scope[],
          code_challenge: '',
          code_challenge_method: 'S256'
        });
      }
    }

    static get observedAttributes() {
      return ['client-id', 'redirect-uri', 'scope'];
    }

    attributeChangedCallback() {
      this.#updateIframeSrc();
    }

    #getAttributes() {
      const client_id = this.getAttribute('client-id') ?? '';
      const redirect_uri = this.getAttribute('redirect-uri') ?? '';
      const scopes = this.getAttribute('scope') ?? '';

      return { client_id, redirect_uri, scopes };
    }

    #updateIframeSrc() {
      const attributes = this.#getAttributes();

      const url = new URL('/embed/button', baseUrl);
      url.searchParams.set('client_id', attributes.client_id);
      url.searchParams.set('redirect_uri', attributes.redirect_uri);
      url.searchParams.set('scopes', attributes.scopes);
      url.searchParams.set('code_challenge', '');
      url.searchParams.set('code_challenge_method', 'S256');

      this.#iframe.setAttribute('src', url.toString());

      this.#gw2me = new Gw2MeClient({ client_id: attributes.client_id });
    }
  }

  window.customElements.define('gw2me-button', Gw2MeButtonElement);
}
