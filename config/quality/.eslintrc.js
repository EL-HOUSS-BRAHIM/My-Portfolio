module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  plugins: [
    'jest'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    
    // Best practices
    'eqeqeq': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-undef': 'error',
    'no-redeclare': 'error',
    
    // Style consistency
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Function rules
    'func-style': ['error', 'declaration', { 'allowArrowFunctions': true }],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    
    // Security
    'no-script-url': 'error',
    'no-inline-comments': 'off',
    
    // Jest specific rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  },
  globals: {
    // Portfolio specific globals
    'Portfolio': 'readonly',
    'ContactForm': 'readonly',
    'ThemeToggle': 'readonly',
    'Navigation': 'readonly',
    'AnimationManager': 'readonly'
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['assets/js-clean/*.js'],
      env: {
        browser: true
      },
      globals: {
        'fetch': 'readonly',
        'IntersectionObserver': 'readonly',
        'ResizeObserver': 'readonly'
      }
    }
  ]
};