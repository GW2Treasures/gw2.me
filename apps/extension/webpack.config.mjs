import { resolve } from 'path';
import CopyPlugin from 'copy-webpack-plugin';

const getConfig = (browser) => (env, argv) => ({
  name: browser,
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background.ts',
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: [{ loader: 'ts-loader', options: { allowTsInNodeModules: true }}],
    }, {
      test: /\.css$/,
      use: ['style-loader', { loader: 'css-loader', options: { esModule: false }}],
    }, {
      test: /\.(svg|woff2?)$/,
      type: 'asset/resource'
    }],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        // build manifest depending on the browser
        {
          from: 'manifest.json',
          transform(input) {
            const manifest = JSON.parse(input);

            // if we are in development mode append -dev to name to distinguish it from the prod extension
            if(argv.mode === 'development') {
              manifest.name += '-dev';
            }

            // chromium does not like browser_specific_settings in the manifest
            const supportsBrowserSpecificSettings = browser !== 'chromium';
            if(!supportsBrowserSpecificSettings) {
              delete manifest['browser_specific_settings'];
            }

            // chromium wants background.service_worker, firefox only supports background.scripts
            const supportsServiceWorker = browser === 'chromium';
            if(!supportsServiceWorker) {
              delete manifest.background.service_worker;
            } else {
              delete manifest.background.scripts;
            }

            // return new manifest
            return JSON.stringify(manifest, null, '  ');
          }
        },
        { from: 'src/popup.html' },
        { from: 'assets/**/*' },
      ]
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      'next/link$': resolve('src/next-link.tsx')
    }
  },
  output: {
    filename: '[name].js',
    path: resolve(`dist/${browser}`),
  },
  devtool: 'source-map'
});

export default [
  getConfig('chromium'),
  getConfig('firefox'),
];
