// next.js does not support next.config.js as module, so we can't use import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  transpilePackages: ['@gw2treasures/ui'],
  output: 'standalone',
};

module.exports = nextConfig;
