export declare enum Scope {
    Identify = "identify",
    Email = "email"
}
export interface AuthorizationUrlParams {
    redirect_uri: string;
    client_id: string;
    scopes: Scope[];
    state?: string;
}
export declare function getAuthorizationUrl({ redirect_uri, client_id, scopes, state }: AuthorizationUrlParams): string;
export interface AuthTokenParams {
    code: string;
    redirect_uri: string;
    client_id: string;
    client_secret: string;
}
export interface TokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token: string;
    scope: string;
}
export declare function getAccessToken({ code, client_id, client_secret, redirect_uri }: AuthTokenParams): Promise<TokenResponse>;
//# sourceMappingURL=index.d.ts.map