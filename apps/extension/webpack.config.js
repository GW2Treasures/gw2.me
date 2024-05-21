const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{ loader: 'ts-loader', options: { allowTsInNodeModules: true }}],
      },
      {
        test: /\.css$/,
        use: ['style-loader', { loader: 'css-loader', options: { esModule: true }}],
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
          const browser = process.env.EXTENSION_BROWSER || 'chromium';
          const supportsBrowserSpecificSettings = browser !== 'chromium';

          if(!supportsBrowserSpecificSettings) {
            const json = JSON.parse(input);
            delete json['browser_specific_settings'];
            return JSON.stringify(json, null, '  ');
          }

          return input;
        }},
        { from: 'popup.html' },
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
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map'
};
