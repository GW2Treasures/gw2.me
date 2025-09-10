import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@gw2treasures/ui'],
  output: 'standalone',

  redirects: async () => [
    { source: '/dev/docs/register-app', destination: '/dev/docs/manage-apps', permanent: true },
  ]
};

export default nextConfig;
