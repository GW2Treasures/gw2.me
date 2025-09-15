import reactConfig from '@gw2treasures/eslint-config/react';
import nextJsPlugin from '@gw2treasures/eslint-plugin-nextjs';
import nextConfig from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  // ignore Next.js generated files
  globalIgnores([
    '.next/',
    'next-env.d.ts'
  ]),

  // extends next/core-web-vitals
  nextConfig.flatConfig.coreWebVitals,

  // extend @gw2treasures/eslint-config/react
  ...reactConfig,

  // enable @gw2treasures/nextjs plugin for page.tsx files (no flat preset yet)
  nextJsPlugin.configs.recommended,
);
