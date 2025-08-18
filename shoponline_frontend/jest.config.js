const { createJestConfig } = require('react-scripts/scripts/utils/createJestConfig');

module.exports = createJestConfig(
  (resolve) => resolve,
  `${__dirname}`,
  false,
  {
    // Test environment
    testEnvironment: 'jsdom',
    
    // Setup files
    setupFilesAfterEnv: [
      '<rootDir>/src/setupTests.js'
    ],
    
    // Test file patterns
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    
    // Coverage configuration
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/index.js',
      '!src/reportWebVitals.js',
      '!src/setupTests.js',
      '!src/serviceWorker.js',
      '!src/**/*.stories.{js,jsx,ts,tsx}',
      '!src/**/index.{js,jsx,ts,tsx}',
      '!src/utils/constants/**',
      '!src/assets/**'
    ],
    
    // Coverage thresholds
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80
      }
    },
    
    // Coverage reporters
    coverageReporters: [
      'text',
      'lcov',
      'html',
      'json-summary'
    ],
    
    // Module name mapping for CSS and assets
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
    },
    
    // Transform ignore patterns
    transformIgnorePatterns: [
      'node_modules/(?!(axios|react-icons|framer-motion)/)'
    ],
    
    // Global setup
    globals: {
      'process.env': {
        NODE_ENV: 'test',
        REACT_APP_API_BASE_URL: 'http://localhost:8000/api/v1',
        REACT_APP_WS_BASE_URL: 'ws://localhost:8000/ws',
        REACT_APP_APP_NAME: 'ShopOnline Uganda Test',
        REACT_APP_ENVIRONMENT: 'test'
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Verbose output
    verbose: true,
    
    // Watch plugins
    watchPlugins: [
      'jest-watch-typeahead/filename',
      'jest-watch-typeahead/testname'
    ],
    
    // Custom reporters
    reporters: [
      'default',
      [
        'jest-junit',
        {
          outputDirectory: './test-results',
          outputName: 'junit.xml',
          ancestorSeparator: ' › ',
          uniqueOutputName: false,
          suiteNameTemplate: '{filepath}',
          classNameTemplate: '{classname}',
          titleTemplate: '{title}'
        }
      ]
    ],
    
    // Clear mocks automatically
    clearMocks: true,
    
    // Restore mocks after each test
    restoreMocks: true,
    
    // Mock modules
    modulePathIgnorePatterns: [
      '<rootDir>/build/'
    ],
    
    // Additional Jest configuration for React Testing Library
    setupFiles: [
      '<rootDir>/src/__mocks__/intersectionObserver.js',
      '<rootDir>/src/__mocks__/matchMedia.js'
    ]
  }
);