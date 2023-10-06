export enum OAuth2ErrorCode {
  access_denied = 'access_denied',
  invalid_client = 'invalid_client',
  invalid_request = 'invalid_request',
  invalid_scope = 'invalid_scope',
  server_error = 'server_error',
  temporarily_unavailable = 'temporarily_unavailable',
  unauthorized_client = 'unauthorized_client',
  unsupported_response_type = 'unsupported_response_type',
}

export class OAuth2Error extends Error {
  public description?: string;

  constructor(public code: OAuth2ErrorCode, { description }: { description?: string }) {
    super(code);

    this.description = description;

    Object.setPrototypeOf(this, OAuth2Error.prototype);
  }
}
