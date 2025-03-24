import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['packages/shared/**/*.ts'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
];