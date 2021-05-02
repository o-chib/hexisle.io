const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  plugins: [
    new ForkTsCheckerWebpackPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader',
          options: {
            // disable type checker here and use it in fork
            transpileOnly: true
          },
        }],
      }
    ],
  },
  resolve: {
    extensions: [ '.js', '.ts', '.tsx' ]
  },
};
