/* eslint-disable @typescript-eslint/no-namespace */
import type { AuthorizationRequest as DbAuthorizationRequest, AuthorizationRequestType } from '@gw2me/database';

export namespace AuthorizationRequestData {
  interface Common {
    response_type: string,
    client_id: string,
    scope: string,
    code_challenge?: string,
    code_challenge_method?: string,
    include_granted_scopes?: string,
    verified_accounts_only?: string,
  }

  export interface OAuth2 extends Common {
    prompt?: string,
    state?: string,
    redirect_uri: string,
    dpop_jkt?: string,
  }

  export type FedCM = Common;
}

export type AuthorizationRequestData<T extends AuthorizationRequestType = AuthorizationRequestType> =
  T extends 'OAuth2' ? AuthorizationRequestData.OAuth2 :
  T extends 'OAuth2_PAR' ? AuthorizationRequestData.OAuth2 :
  T extends 'FedCM' ? AuthorizationRequestData.FedCM :
  never;

export namespace AuthorizationRequest {
  export type OAuth2 = DbAuthorizationRequest & { type: 'OAuth2', data: AuthorizationRequestData.OAuth2 };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export type OAuth2_PAR = DbAuthorizationRequest & { type: 'OAuth2_PAR', data: AuthorizationRequestData.OAuth2 };
  export type FedCM = DbAuthorizationRequest & { type: 'FedCM', data: AuthorizationRequestData.FedCM };
}
export type AuthorizationRequest = AuthorizationRequest.OAuth2 | AuthorizationRequest.OAuth2_PAR | AuthorizationRequest.FedCM;
