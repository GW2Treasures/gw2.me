import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://gw2.me/' },
    { url: 'https://gw2.me/login' },
    { url: 'https://gw2.me/discover' },
    { url: 'https://gw2.me/extension' },
    { url: 'https://gw2.me/dev/docs' },
    { url: 'https://gw2.me/legal' },
    { url: 'https://gw2.me/privacy' },
  ];
}
