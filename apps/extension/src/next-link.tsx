import { FC, ReactNode } from 'react';

export interface LinkProps {
  href: string;
  children: ReactNode;
}

const Link: FC<LinkProps> = ({ href, children }) => {
  return <a href={href}>{children}</a>;
};

export default Link;
