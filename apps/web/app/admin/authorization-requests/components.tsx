import { AuthorizationRequestState, AuthorizationRequestType } from '@gw2me/database';
import { isTruthy } from '@gw2treasures/helper/is';
import { FlexRow } from '@gw2treasures/ui/components/Layout/FlexRow';
import { AuthorizationRequestData } from 'app/(authorize)/authorize/types';
import { type FC } from 'react';

export interface StateProps {
  state: AuthorizationRequestState | 'Expired'
}

export const State: FC<StateProps> = ({ state }) => {
  return (
    <FlexRow>
      <span style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: state === 'Expired' || state === 'Canceled' ? '#f44336' : state === 'Authorized' ? '#4caf50' : '#03a9f4', opacity: .8 }}/>
      {state}
    </FlexRow>
  );
};


export interface FeaturesProps<T extends AuthorizationRequestType> {
  type: T,
  data: AuthorizationRequestData<T>,
}

export const Features = <T extends AuthorizationRequestType>({ type, data }: FeaturesProps<T>) => {
  const features = [
    data.code_challenge_method && 'PKCE',
    data.include_granted_scopes && 'Include Granted Scopes',
    type === AuthorizationRequestType.OAuth2 && (data as AuthorizationRequestData.OAuth2).prompt && `Prompt: ${(data as AuthorizationRequestData.OAuth2).prompt}`,
    type === AuthorizationRequestType.OAuth2 && !(data as AuthorizationRequestData.OAuth2).state && 'No State',
    data.verified_accounts_only && 'Verified Accounts',
  ].filter(isTruthy).join(', ');

  return (
    features
  );
};
