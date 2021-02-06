const path = require('path');
const common = require('./webpack.shared.js');
const {merge} = require('webpack-merge');

module.exports = merge(common, {
  entry: './src/client/main.ts',
  output: {
    filename: 'game.js',
    path: path.resolve(__dirname, 'public'),
  },
});
