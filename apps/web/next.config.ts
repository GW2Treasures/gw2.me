import type { NextConfig } from 'next';
import path from 'path';
// @ts-expect-error no types available
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@gw2treasures/ui'],
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },

  redirects: async () => [
    { source: '/dev/docs/register-app', destination: '/dev/docs/manage-apps', permanent: true },
  ]
};

export default nextConfig;
