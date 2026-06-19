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
      // core/ports/usecase sao puros: sem framework nem libs de validacao HTTP.
      files: ['src/core/**/*.ts', 'src/ports/**/*.ts', 'src/usecase/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['@nestjs/*', '@nestjs'], message: 'core/ports/usecase nao importam @nestjs/*.' },
              {
                group: ['class-validator', 'class-transformer'],
                message: 'core/ports/usecase nao importam libs de validacao HTTP.',
              },
            ],
          },
        ],
      },
    },
    {
      // testes podem importar utilitarios livremente.
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
  ],
};
