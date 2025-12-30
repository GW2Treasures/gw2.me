import { redirect } from 'next/navigation';
import { NoticeContext } from '../NoticeContext/NoticeContext';
import { SubmitAuthenticationResult } from './actions';

export async function handleAuthenticationResult(result: SubmitAuthenticationResult, notice: NoticeContext, returnTo?: string) {
  if (!result.success) {
    if (result.reason === 'unknown-credential') {
      notice.show({ type: 'error', children: 'Unknown passkey. Please make sure you are using the correct passkey for this account.' });

      if (PublicKeyCredential.signalUnknownCredential) {
        PublicKeyCredential.signalUnknownCredential(result.unknownCredential);
      }

      return;
    } else if (result.reason === 'verification-failed') {
      notice.show({ type: 'error', children: 'Passkey verification failed. Please try again.' });
      return;
    }
  }

  if(PublicKeyCredential.signalAllAcceptedCredentials) {
    console.log('PublicKeyCredential.signalAllAcceptedCredentials', result.acceptedCredentials);
    await PublicKeyCredential.signalAllAcceptedCredentials(result.acceptedCredentials);
  }

  if(PublicKeyCredential.signalCurrentUserDetails) {
    console.log('PublicKeyCredential.signalCurrentUserDetails', result.currentUserDetails);
    await PublicKeyCredential.signalCurrentUserDetails(result.currentUserDetails);
  }

  redirect(returnTo || '/profile');
}
