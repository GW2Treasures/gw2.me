import nextJsPlugin from '@gw2treasures/eslint-plugin-nextjs';
import reactConfig from '@gw2treasures/eslint-config/react';
import tseslint from 'typescript-eslint';
import { flatConfig as nextConfig } from '@next/eslint-plugin-next';

export default tseslint.config(
  // ignore all files in .next
  { ignores: ['.next'] },

  // extends next/core-web-vitals
  nextConfig.coreWebVitals,

  // extend @gw2treasures/eslint-config/react
  ...reactConfig,
  
  // enable @gw2treasures/nextjs plugin for page.tsx files (no flat preset yet)
  nextJsPlugin.configs.recommended,
);
