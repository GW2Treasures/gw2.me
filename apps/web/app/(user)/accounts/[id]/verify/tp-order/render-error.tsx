import { ReactNode } from 'react';
import { VerifyChallengeActionResults } from './verify-challenge.action';
import { Notice } from '@gw2treasures/ui/components/Notice/Notice';
import { Permission } from '@/components/Permissions/Permission';
import Link from 'next/link';

export function renderError(error?: VerifyChallengeActionResults): ReactNode {
  switch (error) {
    case undefined: return;
    case 'account_already_verified': return (<Notice>The account you are trying to verify is already verified</Notice>);
    case 'account_not_found': return (<Notice type="error">The account you are trying to verify is already verified</Notice>);
    case 'api_key_not_found': return (<Notice type="warning">To use the Trading Post Challenge to verify this account, you need to first add an API key with <Permission permission="tradingpost"/> permission. <Link href="/accounts/add">Add API key now</Link>.</Notice>);
    case 'gw2api_error': return (<Notice type="error">The Guild Wars 2 API returned an error while trying to verify this challenge.</Notice>);
    case 'pending': return (<Notice>Waiting for the buy order to show up in the Guild Wars 2 API.</Notice>);
    case 'unknown':
    default:
      return (<Notice type="error">Unknown error</Notice>);
  }
}
