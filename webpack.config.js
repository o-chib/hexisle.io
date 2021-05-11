const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');
const nodeExternals = require('webpack-node-externals')

const shared = {
	plugins: [
		new ForkTsCheckerWebpackPlugin()
	],
	module: {
	  	rules: [{
		  	test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					// disable type checker here and use it in fork
					transpileOnly: true
				},
			}],
		}],
	},
	resolve: {
		extensions: [ '.js', '.ts', '.tsx' ]
	},
};

const client = {
	entry: './src/client/main.ts',
	output: {
	  filename: 'game.js',
	  path: path.resolve(__dirname, 'public'),
	},
};

const server = {
	entry: './src/server/server.ts',
	output: {
		filename: 'server-bundle.js',
		path: path.resolve(__dirname, './'),
	},
	target: 'node',
	externals: [nodeExternals()],
}

module.exports = [
    Object.assign({} , shared, client),
    //Object.assign({} , shared, server),
];
