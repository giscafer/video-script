module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'implicit-arrow-linebreak': 0,
    'comma-dangle': 0,
    'function-paren-newline': 0,
    'import/extensions': 0,
  },
};
