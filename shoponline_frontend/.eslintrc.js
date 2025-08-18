module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    'prettier',
  ],
  rules: {
    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'warn',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': 'warn',
    'react/no-deprecated': 'warn',
    'react/no-direct-mutation-state': 'error',
    'react/no-is-mounted': 'error',
    'react/no-unknown-property': 'error',
    'react/self-closing-comp': 'warn',

    //problematic rules
    "no-case-declarations": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/no-autofocus": "off",
    "jsx-a11y/label-has-associated-control": "off",
    "no-dupe-keys": "off",
    "react-hooks/rules-of-hooks": "off",
    "no-return-await": "off",
    "no-const-assign": "off",
    "no-duplicate-imports": "off",
    "react/no-unknown-property": "off",

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // JavaScript rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    'no-var': 'error',
    'prefer-const': 'warn',
    'prefer-arrow-callback': 'warn',
    'arrow-spacing': 'warn',
    'comma-dangle': ['warn', 'only-multiline'],
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'jsx-quotes': ['warn', 'prefer-double'],
    'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 1 }],
    'no-trailing-spaces': 'warn',
    'eol-last': 'warn',
    'indent': ['warn', 2, { SwitchCase: 1 }],
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],

    // Accessibility rules
    'jsx-a11y/anchor-is-valid': 'off', // Handled by React Router
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/img-redundant-alt': 'warn',

    // Performance rules
    'react/jsx-no-bind': 'warn',
    'react/jsx-no-literals': 'off',

    // Code quality rules
    'eqeqeq': ['error', 'always'],
    'no-duplicate-imports': 'error',
    'no-empty-function': 'warn',
    'no-implicit-coercion': 'warn',
    'no-return-await': 'error',
    'require-await': 'warn',
    'prefer-template': 'warn',

    // Prettier integration
    'prettier/prettier': ['warn', {
      endOfLine: 'auto',
      singleQuote: true,
      trailingComma: 'es5',
      semi: true,
      printWidth: 100,
      tabWidth: 2,
    }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['src/serviceWorker.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  globals: {
    process: 'readonly',
  },
};