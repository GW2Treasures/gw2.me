import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api',
        '/auth',
        '/fed-cm'
      ]
    },
    sitemap: 'https://gw2.me/sitemap.xml',
  };
}
