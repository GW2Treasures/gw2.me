/* eslint-disable @next/next/no-img-element */
import { createHash } from 'node:crypto';
import { FC } from 'react';

interface GravatarProps {
  email?: string,
}

export const Gravatar: FC<GravatarProps> = ({ email }) => {
  if(!email) {
    return null;
  }

  const hash = createHash('sha256').update(email.trim().toLocaleLowerCase()).digest('hex');

  return (
    <img src={`https://gravatar.com/avatar/${hash}?s=48`} alt="" width={24} height={24} style={{ borderRadius: 2 }}/>
  );
};
