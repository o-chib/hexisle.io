const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ],
  },
  resolve: {
    extensions: [ '.js', '.ts', '.tsx' ]
  },
};
