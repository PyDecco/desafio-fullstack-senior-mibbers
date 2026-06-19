module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { project: 'tsconfig.json', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.js', 'coverage'],
  settings: {
    'import/resolver': { typescript: { project: 'tsconfig.json' } },
  },
  rules: {
    // Tipagem honesta: sem `any` no chao (criterio de avaliacao).
    '@typescript-eslint/no-explicit-any': 'error',
    // Fronteira de dependencia entre camadas (hexagonal): tudo aponta pra dentro.
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/core',
            from: ['./src/ports', './src/usecase', './src/adapter'],
            message: 'core nao pode depender de ports/usecase/adapter.',
          },
          {
            target: './src/ports',
            from: ['./src/usecase', './src/adapter'],
            message: 'ports so pode depender de core.',
          },
          {
            target: './src/usecase',
            from: ['./src/adapter'],
            message: 'usecase nao pode depender de adapter.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/core/**/*.ts', 'src/ports/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['@nestjs/*', '@nestjs'], message: 'core/ports nao importam @nestjs/*.' },
              {
                group: ['class-validator', 'class-transformer'],
                message: 'core/ports nao importam libs de validacao HTTP.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/usecase/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['class-validator', 'class-transformer'],
                message: 'usecase nao importa libs de validacao HTTP.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
  ],
};
