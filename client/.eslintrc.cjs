module.exports = {
	env: {
		es6: true,
		browser: true
	},
	extends: ['eslint:recommended', 'plugin:prettier/recommended'],
	plugins: ['prettier'],
	rules: {
		'prettier/prettier': 'warn'
	},
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	}
};
