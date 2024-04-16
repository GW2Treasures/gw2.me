const path = require('path');
const { plugins } = require('pretty-format');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  transpilePackages: ['@gw2treasures/ui'],
  output: 'standalone',

  // workaround for broken CSS chunking in next.js 14.2
  webpack(config, { dev }) {
    if(dev) {
      config.plugins = config.plugins.filter((plugin) => plugin.constructor.name !== 'CssChunkingPlugin');
    }
    return config;
  }
};

module.exports = nextConfig;
