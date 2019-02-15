module.exports = {
  extends: 'eslint:recommended',

  rules: {
    'no-console': 0,
  },

  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    }
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
        chai: true,
      },
      globals: {
        sinon: true,
        proxyquire: true,
        expect: true
      }
    }
  ]
};

