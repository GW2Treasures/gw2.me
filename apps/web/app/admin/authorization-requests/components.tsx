import { AuthorizationRequestState } from '@gw2me/database';
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


export interface FeaturesProps {
  data: AuthorizationRequestData
}

export const Features: FC<FeaturesProps> = ({ data }) => {
  const features = [
    data.code_challenge_method && 'PKCE',
    data.include_granted_scopes && 'Include Granted Scopes',
    data.prompt && `Prompt: ${data.prompt}`,
    !data.state && 'No State',
    data.verified_accounts_only && 'Verified Accounts',
  ].filter(isTruthy).join(', ');

  return (
    features
  );
};
