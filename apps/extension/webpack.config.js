const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

const getConfig = (browser) => (env, argv) => ({
  name: browser,
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{ loader: 'ts-loader', options: { allowTsInNodeModules: true }}],
      },
      {
        test: /\.css$/,
        use: ['style-loader', { loader: 'css-loader', options: { esModule: false }}],
      },
      {
        test: /\.(svg|woff2?)$/,
        type: 'asset/resource'
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', transform(input) {
          const json = JSON.parse(input);

          if(argv.mode === 'development') {
            json.name += '-dev';
          }
          
          const supportsBrowserSpecificSettings = browser !== 'chromium';
          if(!supportsBrowserSpecificSettings) {
            delete json['browser_specific_settings'];
          }

          const supportsServiceWorker = browser === 'chromium';
          if(!supportsServiceWorker) {
            delete json.background.service_worker;
          } else {
            delete json.background.scripts;
          }

          return JSON.stringify(json, null, '  ');
        }},
        { from: 'src/popup.html' },
        { from: 'assets/**/*' },
      ]
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      'next/link$': path.resolve('src/next-link.tsx')
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, `dist/${browser}`),
  },
  devtool: 'source-map'
});

module.exports = [
  getConfig('chromium'),
  getConfig('firefox'),
];
