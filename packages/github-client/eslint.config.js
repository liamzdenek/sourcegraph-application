import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['packages/github-client/**/*.ts'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
];