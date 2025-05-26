import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],

  manifest: ({ mode }) => ({
    name: mode === 'development' ? 'gw2.me (Dev)' : 'gw2.me',
    permissions: ['identity', 'storage'],
    browser_specific_settings: {
      gecko: {
        id: 'extension@gw2.me'
      }
    }
  }),

  alias: {
    // @gw2treasures/ui Button uses next/link
    // we don't want next as dependency, so we alias it to a simple <a>
    'next/link': 'src/next-link.tsx',
  },
});
