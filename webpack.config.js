const webpack = require('webpack');
const ejs = require('ejs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');
const { version } = require('./package.json');

function transformHtml(content) {
	return ejs.render(content.toString(), {
		...process.env,
	});
}

const config = {
	mode: process.env.NODE_ENV,
	context: path.join(__dirname, '/src'),
	entry: {
		'background/background': './background/background.js',
		'devtools/devtools': './devtools/devtools.js',
		'devtools/app': './scripts/App.js',
		'options/options': './options/options.js',
		'content_script/content_script': './content_script/content_script.js',
	},
	output: {
		path: path.join(__dirname, '/dist'),
		filename: '[name].js',
	},
	resolve: {
		extensions: ['.js'],
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
			},
			{
				test: /\.sass$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader?indentedSyntax'],
			},
			{
				test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: '/icons/',
					emitFile: false,
				},
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: '/fonts/',
					emitFile: false,
				},
			},
		],
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			'window.jQuery': 'jquery',
		}),
		new webpack.DefinePlugin({
			global: 'window',
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css',
		}),
		new CopyWebpackPlugin([
			{ from: 'icons', to: 'icons', ignore: ['icon.xcf'] },
			{ from: 'devtools/views', to: 'devtools/views/', transform: transformHtml },
			{ from: 'popup/popup.html', to: 'popup/popup.html', transform: transformHtml },
			{ from: 'options/options.html', to: 'options/options.html', transform: transformHtml },
			{ from: 'devtools/panel.html', to: 'devtools/panel.html', transform: transformHtml },
			{ from: 'devtools/devtools.html', to: 'devtools/devtools.html', transform: transformHtml },
			{
				from: 'manifest.json',
				to: 'manifest.json',
				transform: content => {
					const jsonContent = JSON.parse(content);
					jsonContent.version = version;

					if (config.mode === 'development') {
						jsonContent.content_security_policy = "script-src 'self' 'unsafe-eval'; object-src 'self'";
					}

					return JSON.stringify(jsonContent, null, 2);
				},
			},
		]),
	],
};

if (config.mode === 'production') {
	config.plugins = (config.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"',
			},
		}),
	]);
}

if (process.env.HMR === 'true') {
	config.plugins = (config.plugins || []).concat([
		new ExtensionReloader({
			manifest: path.join(__dirname, '/src/manifest.json'),
		}),
	]);
}

module.exports = config;
