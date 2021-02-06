const path = require('path');
const shared = require('./webpack.shared.js');
const {merge} = require('webpack-merge');
const nodeExternals = require('webpack-node-externals')

module.exports = merge(shared, {
  entry: './src/server/server.ts',
  output: {
    filename: 'server-bundle.js',
    path: path.resolve(__dirname, './'),
  },
  externals: [nodeExternals()],
});
