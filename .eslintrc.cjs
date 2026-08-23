module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react-refresh'],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.config.js', '*.cjs'],
  rules: {
    'react/prop-types': 'off', // el proyecto documenta props con JSDoc
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'react-hooks/exhaustive-deps': 'warn',
    'no-empty': ['warn', { allowEmptyCatch: true }],
  },
  overrides: [
    {
      files: ['**/*.test.{js,jsx}'],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  ],
};
