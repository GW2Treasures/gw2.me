const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  reactStrictMode: true,
  output: 'standalone',
  swcMinify: true,
  webpack(config, { isServer }) {
    if(isServer) {
      config.plugins.push(new PrismaPlugin());
    }

    return config;
  }
};

module.exports = nextConfig;
