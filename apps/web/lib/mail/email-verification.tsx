import VerifyEmailMail from '@gw2me/emails/verify-email';
import { db } from '../db';
import { sendMail } from '../mail';
import { randomBytes } from 'crypto';

export async function sendEmailVerificationMail(emailId: string) {
  const verificationToken = generateEmailVerificationToken();

  const { email, user } = await db.userEmail.update({
    where: { id: emailId },
    data: { verificationToken },
    select: { email: true, user: { select: { name: true }}}
  });

  const link = new URL(`/emails/verify?token=${verificationToken}`, process.env.GW2ME_URL ?? 'https://gw2.me/');

  await sendMail(
    'Verify your email',
    { name: user.name, address: email },
    <VerifyEmailMail username={user.name} verifyLink={link.toString()}/>
  );
}

function generateEmailVerificationToken(): string {
  return randomBytes(16).toString('base64url');
}
