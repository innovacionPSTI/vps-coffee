/** @type {import('jest').Config} */
const config = {
  displayName: '@vps/web',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Static assets
    '^.+\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',
    '^.+\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@vps/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@vps/ui$': '<rootDir>/../../packages/ui/src/index.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = config
