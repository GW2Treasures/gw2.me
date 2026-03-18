import { defineConfig, type UserConfig } from 'tsdown';

const CI = !!process.env.CI;

const config: UserConfig = defineConfig({
  platform: 'neutral',
  minify: CI,
  dts: {
    tsconfig: './tsconfig.src.json',
    sourcemap: !CI
  },
  attw: {
    profile: 'esm-only',
    level: CI ? 'error' : 'warn',
  },
  publint: {
    level: CI ? 'error' : 'warning',
  }
});

export default config;
