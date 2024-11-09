import { LayoutProps } from '@/lib/next';

export default function DocsLayout({ children }: LayoutProps) {
  return children;
}

export const metadata = {
  title: {
    template: '%s · Developer Documentation · gw2.me',
    default: '',
  }
};
