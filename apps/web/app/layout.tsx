import { ReactNode } from 'react';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: {
    template: '%s · gw2.me',
    absolute: ''
  },
  description: 'Securly manage GW2 API access',
};
