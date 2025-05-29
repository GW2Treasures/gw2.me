import { db } from '@/lib/db';
import { sendEmailVerificationMail } from '@/lib/mail/email-verification';
import { Prisma } from '@gw2me/database';
import { ProviderProfile } from 'app/auth/providers';
import { after } from 'next/server';

export async function handleNewEmail(userId: string, profile: Pick<ProviderProfile, 'email' | 'emailVerified'>) {
  // if this provider does not provide an email, we don't have to do anything...
  if(!profile.email) {
    return;
  }

  // check if the user has a default email already
  const hasDefault = 0 < await db.userEmail.count({
    where: { isDefaultForUserId: userId }
  });

  // index to find existing email in db
  const userId_email: Prisma.UserEmailUserIdEmailCompoundUniqueInput = {
    userId,
    email: profile.email
  };

  // get existing email
  const existingEmail = await db.userEmail.findUnique({
    select: { id: true, verified: true, verificationToken: true },
    where: { userId_email }
  });

  if(existingEmail && !existingEmail.verified) {
    // if this email already exists but is not verified, we can either use the provider verification
    // or send an email verification mail if we haven't done so
    if(profile.emailVerified) {
      // the provider says its verified, update in db
      await db.userEmail.update({
        where: { userId_email },
        data: { verified: true, verificationToken: null, verifiedAt: new Date() }
      });
    } else if(!existingEmail.verificationToken) {
      // we haven't send a verification email yet
      after(() => sendEmailVerificationMail(existingEmail.id));
    }
  } else if(!existingEmail) {
    // create the email if it doesn't exist yet
    const { id } = await db.userEmail.create({
      select: { id: true },
      data: {
        ...userId_email,
        verified: profile.emailVerified,
        verifiedAt: profile.emailVerified ? new Date() : undefined,
        isDefaultForUserId: !hasDefault ? userId : undefined,
      }
    });

    if(!profile.emailVerified) {
      // if the provider didn't verify this email yet, send verification email
      after(() => sendEmailVerificationMail(id));
    }
  }
}
