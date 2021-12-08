module.exports = {
	root: true,
	parserOptions: {
		parser: 'babel-eslint',
	},
	env: {
		browser: true,
		webextensions: true,
	},
	extends: ['airbnb-base', 'plugin:prettier/recommended'],
	settings: {
		'import/resolver': {
			webpack: {
				config: './webpack.config.js',
			},
		},
	},
	// add your custom rules here
	rules: {
		// don't require .vue extension when importing
		'import/extensions': [
			'error',
			'always',
			{
				js: 'never',
			},
		],
		// disallow reassignment of function parameters
		// disallow parameter object manipulation except for specific exclusions
		'no-param-reassign': [
			'error',
			{
				props: true,
				ignorePropertyModificationsFor: [
					'acc', // for reduce accumulators
					'e', // for e.returnvalue
				],
			},
		],
		// disallow default export over named export
		'import/prefer-default-export': 'off',
		'class-methods-use-this': 'off',
		// allow debugger during development
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	},
};
