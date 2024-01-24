/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'indent': ['warn', 2],
    'semi': ['warn', 'never'],
    'quotes': [2, 'single', { 'avoidEscape': true }]
  },
  ignorePatterns: ['*.js']
}
