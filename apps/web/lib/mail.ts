import nodemailer, { type Transporter } from 'nodemailer';
import { render } from '@react-email/render';
import { ReactElement } from 'react';
import { Address } from 'nodemailer/lib/mailer';

let transport: Transporter;

function getTransport() {
  if(transport) {
    return transport;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if(!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('SMTP not configured');
    return undefined;
  }

  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
  });

  return transport;
}

export async function sendMail(subject: string, to: string | Address, content: ReactElement) {
  await getTransport()?.sendMail({
    subject, to,
    from: '"gw2.me" <noreply@gw2.me>',
    html: await render(content, { plainText: false }),
    text: await render(content, { plainText: true }),
  });
}
