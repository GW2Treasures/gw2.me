import config from '@gw2treasures/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['.wxt', '.output'] },
  autoImports,
  ...config
]);
