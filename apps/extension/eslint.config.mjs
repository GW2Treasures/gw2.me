import config from '@gw2treasures/eslint-config/react';
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default [
  { ignores: ['.wxt', '.output'] },

  autoImports,

  ...config,
];
