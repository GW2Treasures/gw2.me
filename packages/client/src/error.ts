export class Gw2MeError extends Error {}

export class Gw2MeOAuthError extends Gw2MeError {
  constructor(
    public error: string,
    public error_description?: string,
    public error_uri?: string
  ) {
    super(
      `Received ${error}` +
      (error_description ? `: ${error_description}` : '') +
      (error_uri ? ` (${error_uri})` : '')
    );
  }
}
