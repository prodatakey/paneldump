module.exports = {
  extends: 'eslint:recommended',

  rules: {
    'no-console': 0,
  },

  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 10,
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
  },

  env: {
    node: true,
    es6: true,
  },

  // Override settings for spec files
  overrides: [
    {
      files: [ 'src/**/*.spec.js' ],
      env: {
        mocha: true,
      },
      globals: {
        sinon: true,
        proxyquire: true,
        expect: true,
      },
    },
  ]
};

