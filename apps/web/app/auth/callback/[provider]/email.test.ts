import { beforeAll, describe, expect, it, vi } from 'vitest';
import { handleNewEmail } from './email';
import { dbMock } from '@/lib/db.mock';
import { UserEmail } from '@gw2me/database';
import { sendEmailVerificationMail } from '@/lib/mail/email-verification';

describe('callback new email', () => {
  beforeAll(() => {
    vi.mock('@/lib/mail/email-verification');
  });

  it('sets default email for first email', async () => {
    const { create } = mockExistingEmails([]);

    await handleNewEmail('user', { email: 'test@test', emailVerified: true });

    expect(sendEmailVerificationMail).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.lastCall![0].data).toMatchInlineSnapshot(
      { verifiedAt: expect.any(Date) }, `
      {
        "email": "test@test",
        "isDefaultForUserId": "user",
        "userId": "user",
        "verified": true,
        "verifiedAt": Any<Date>,
      }
    `);
  });

  it('does not set default email for existing default email', async () => {
    const { create } = mockExistingEmails([
      { id: 'default', email: 'default@test', verified: true, verificationToken: null, isDefault: true }
    ]);

    await handleNewEmail('user', { email: 'test@test', emailVerified: true });

    expect(sendEmailVerificationMail).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.lastCall![0].data).toMatchInlineSnapshot(
      { verifiedAt: expect.any(Date) }, `
      {
        "email": "test@test",
        "isDefaultForUserId": undefined,
        "userId": "user",
        "verified": true,
        "verifiedAt": Any<Date>,
      }
    `);
  });

  it('updates verification for existing email', async () => {
    const { create, update } = mockExistingEmails([
      { id: 'existing', email: 'existing@test', verified: false, verificationToken: null, isDefault: true }
    ]);

    await handleNewEmail('user', { email: 'existing@test', emailVerified: true });

    expect(create).not.toHaveBeenCalled();
    expect(sendEmailVerificationMail).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledOnce();
    expect(update.mock.lastCall![0]).toMatchInlineSnapshot(
      { data: { verifiedAt: expect.any(Date) }}, `
      {
        "data": {
          "verificationToken": null,
          "verified": true,
          "verifiedAt": Any<Date>,
        },
        "where": {
          "userId_email": {
            "email": "existing@test",
            "userId": "user",
          },
        },
      }
    `);
  });

  it('does not update verification for already existing verified email', async () => {
    const { create, update } = mockExistingEmails([
      { id: 'existing', email: 'existing@test', verified: true, verificationToken: null, isDefault: true }
    ]);

    await handleNewEmail('user', { email: 'existing@test', emailVerified: false });

    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(sendEmailVerificationMail).not.toHaveBeenCalled();
  });

  it('sends verification email for new email', async () => {
    const { create } = mockExistingEmails([]);

    await handleNewEmail('user', { email: 'new@test', emailVerified: false });

    expect(create).toHaveBeenCalledOnce();
    expect(sendEmailVerificationMail).toHaveBeenCalledExactlyOnceWith('new');
  });

  it('sends verification email for existing unverified email', async () => {
    const { create, update } = mockExistingEmails([
      { id: 'existing', email: 'existing@test', verified: false, verificationToken: null, isDefault: true }
    ]);

    await handleNewEmail('user', { email: 'existing@test', emailVerified: false });

    expect(create).not.toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
    expect(sendEmailVerificationMail).toHaveBeenCalledExactlyOnceWith('existing');
  });

  it('does not send verification email for existing unverified email with pending verification', async () => {
    const { create, update } = mockExistingEmails([
      { id: 'existing', email: 'existing@test', verified: false, verificationToken: 'token', isDefault: true }
    ]);

    await handleNewEmail('user', { email: 'existing@test', emailVerified: false });

    expect(create).not.toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
    expect(sendEmailVerificationMail).not.toHaveBeenCalled();
  });

});

function mockExistingEmails(emails: (Pick<UserEmail, 'id' | 'email' | 'verified' | 'verificationToken'> & { isDefault?: boolean })[]) {
  vi.resetAllMocks();

  dbMock.userEmail.create.mockResolvedValue({ id: 'new' } as never);

  dbMock.userEmail.count.mockResolvedValue(emails.some((mail) => mail.isDefault) ? 1 : 0);

  dbMock.userEmail.findUnique.mockImplementation(({ where }) => {
    return Promise.resolve(emails.find((m) => where.userId_email?.email === m.email) ?? null) as never;
  });

  return {
    create: dbMock.userEmail.create,
    update: dbMock.userEmail.update
  };
}
