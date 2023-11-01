import { ReactNode } from 'react';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return children;
}

export const metadata = {
  title: {
    template: '%s · Developer Documentation · gw2.me',
    default: '',
  }
};
