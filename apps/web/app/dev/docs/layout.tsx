export default function DocsLayout({ children }: LayoutProps<'/dev/docs'>) {
  return children;
}

export const metadata = {
  title: {
    template: '%s · Developer Documentation · gw2.me',
    default: '',
  }
};
