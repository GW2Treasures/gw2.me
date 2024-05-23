const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

const getConfig = (browser) => ({
  name: browser,
  entry: {
    popup: './src/popup/index.tsx',
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
          const supportsBrowserSpecificSettings = browser !== 'chromium';

          if(!supportsBrowserSpecificSettings) {
            const json = JSON.parse(input);
            delete json['browser_specific_settings'];
            return JSON.stringify(json, null, '  ');
          }

          return input;
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
